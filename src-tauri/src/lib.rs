use std::{
    fs, io,
    path::{Path, PathBuf},
    time::{SystemTime, UNIX_EPOCH},
};

use tauri::Manager;
use tauri_plugin_log::{RotationStrategy, Target, TargetKind};

const DIAGNOSTICS_SCHEMA_VERSION: u8 = 1;
const MAX_ATTACHED_LOG_FILES: usize = 3;
const MAX_LOG_TAIL_BYTES: usize = 64 * 1024;

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct CrashDiagnosticsResult {
    report_path: String,
    log_folder: String,
    attached_log_count: usize,
    reveal_error: Option<String>,
}

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct CrashDiagnosticsReport {
    kind: &'static str,
    schema_version: u8,
    created_unix_seconds: u64,
    renderer_report: serde_json::Value,
    log_folder: String,
    log_files: Vec<AttachedLogContext>,
    notes: Vec<String>,
}

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct AttachedLogContext {
    file_name: String,
    path: String,
    size_bytes: u64,
    modified_unix_seconds: Option<u64>,
    tail_truncated: bool,
    tail: String,
}

struct LogFileCandidate {
    file_name: String,
    path: PathBuf,
    size_bytes: u64,
    modified_unix_seconds: Option<u64>,
}

fn install_panic_logger() {
    std::panic::set_hook(Box::new(|panic_info| {
        let payload = panic_info
            .payload()
            .downcast_ref::<&str>()
            .map(|message| message.to_string())
            .or_else(|| panic_info.payload().downcast_ref::<String>().cloned())
            .unwrap_or_else(|| "unknown panic payload".to_string());
        let location = panic_info
            .location()
            .map(|location| {
                format!(
                    "{}:{}:{}",
                    location.file(),
                    location.line(),
                    location.column()
                )
            })
            .unwrap_or_else(|| "unknown location".to_string());
        let backtrace = std::backtrace::Backtrace::force_capture();
        let report = format!("rust panic: {payload} at {location}\nbacktrace:\n{backtrace}");

        eprintln!("{report}");
        log::error!("{report}");
    }));
}

fn reveal_in_file_manager(path: &PathBuf) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("explorer")
            .arg(path)
            .spawn()
            .map_err(|err| err.to_string())?;
    }
    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(path)
            .spawn()
            .map_err(|err| err.to_string())?;
    }
    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open")
            .arg(path)
            .spawn()
            .map_err(|err| err.to_string())?;
    }

    Ok(())
}

fn current_unix_seconds() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_secs())
        .unwrap_or(0)
}

fn path_to_string(path: &Path) -> String {
    path.display().to_string()
}

fn modified_unix_seconds(modified_at: SystemTime) -> Option<u64> {
    modified_at
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_secs())
        .ok()
}

fn is_diagnostics_report_name(file_name: &str) -> bool {
    file_name.starts_with("idc-crash-report-") && file_name.ends_with(".json")
}

fn collect_log_context(log_dir: &Path) -> Result<Vec<AttachedLogContext>, String> {
    let entries = match fs::read_dir(log_dir) {
        Ok(entries) => entries,
        Err(error) if error.kind() == io::ErrorKind::NotFound => return Ok(Vec::new()),
        Err(error) => return Err(error.to_string()),
    };

    let mut candidates = Vec::new();

    for entry_result in entries {
        let entry = match entry_result {
            Ok(entry) => entry,
            Err(_) => continue,
        };
        let metadata = match entry.metadata() {
            Ok(metadata) => metadata,
            Err(_) => continue,
        };
        if !metadata.is_file() {
            continue;
        }

        let file_name = entry.file_name().to_string_lossy().into_owned();
        if is_diagnostics_report_name(&file_name) {
            continue;
        }

        candidates.push(LogFileCandidate {
            file_name,
            path: entry.path(),
            size_bytes: metadata.len(),
            modified_unix_seconds: metadata.modified().ok().and_then(modified_unix_seconds),
        });
    }

    candidates.sort_by(|left, right| {
        right
            .modified_unix_seconds
            .cmp(&left.modified_unix_seconds)
            .then_with(|| right.file_name.cmp(&left.file_name))
    });

    Ok(candidates
        .into_iter()
        .take(MAX_ATTACHED_LOG_FILES)
        .map(read_log_context)
        .collect())
}

fn read_log_context(candidate: LogFileCandidate) -> AttachedLogContext {
    let (tail, tail_truncated) = read_file_tail(&candidate.path, MAX_LOG_TAIL_BYTES)
        .unwrap_or_else(|error| (format!("Unable to read log tail: {error}"), false));

    AttachedLogContext {
        file_name: candidate.file_name,
        path: path_to_string(&candidate.path),
        size_bytes: candidate.size_bytes,
        modified_unix_seconds: candidate.modified_unix_seconds,
        tail_truncated,
        tail,
    }
}

fn read_file_tail(path: &Path, max_bytes: usize) -> Result<(String, bool), String> {
    let bytes = fs::read(path).map_err(|error| error.to_string())?;
    let truncated = bytes.len() > max_bytes;
    let tail_bytes = if truncated {
        &bytes[bytes.len() - max_bytes..]
    } else {
        &bytes[..]
    };
    let first_full_line = if truncated {
        tail_bytes
            .iter()
            .position(|byte| *byte == b'\n')
            .map(|index| index + 1)
            .unwrap_or(0)
    } else {
        0
    };

    Ok((
        String::from_utf8_lossy(&tail_bytes[first_full_line..]).into_owned(),
        truncated,
    ))
}

#[tauri::command]
fn open_log_folder(app: tauri::AppHandle) -> Result<(), String> {
    let path = app.path().app_log_dir().map_err(|err| err.to_string())?;
    fs::create_dir_all(&path).map_err(|err| err.to_string())?;
    reveal_in_file_manager(&path)
}

#[tauri::command]
fn open_save_folder(app: tauri::AppHandle) -> Result<(), String> {
    let mut path = app
        .path()
        .app_local_data_dir()
        .map_err(|err| err.to_string())?;
    path.push("saves");
    fs::create_dir_all(&path).map_err(|err| err.to_string())?;
    reveal_in_file_manager(&path)
}

#[tauri::command]
fn write_crash_diagnostics(
    app: tauri::AppHandle,
    renderer_report: serde_json::Value,
) -> Result<CrashDiagnosticsResult, String> {
    let log_dir = app.path().app_log_dir().map_err(|err| err.to_string())?;
    fs::create_dir_all(&log_dir).map_err(|err| err.to_string())?;

    let created_unix_seconds = current_unix_seconds();
    let log_files = collect_log_context(&log_dir)?;
    let attached_log_count = log_files.len();
    let report = CrashDiagnosticsReport {
        kind: "idc.renderer-crash-diagnostics",
        schema_version: DIAGNOSTICS_SCHEMA_VERSION,
        created_unix_seconds,
        renderer_report,
        log_folder: path_to_string(&log_dir),
        log_files,
        notes: vec![
            "Attach this file to the bug report. It includes the renderer crash report and recent desktop log context.".to_string(),
            "If the team asks for full logs, use the log folder path in this report.".to_string(),
        ],
    };
    let report_path = log_dir.join(format!("idc-crash-report-{created_unix_seconds}.json"));
    let report_text = serde_json::to_string_pretty(&report).map_err(|err| err.to_string())?;

    fs::write(&report_path, report_text).map_err(|err| err.to_string())?;

    Ok(CrashDiagnosticsResult {
        report_path: path_to_string(&report_path),
        log_folder: path_to_string(&log_dir),
        attached_log_count,
        reveal_error: reveal_in_file_manager(&log_dir).err(),
    })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    install_panic_logger();

    tauri::Builder::default()
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(
            tauri_plugin_log::Builder::default()
                .level(log::LevelFilter::Info)
                .targets([
                    Target::new(TargetKind::Stdout),
                    Target::new(TargetKind::LogDir {
                        file_name: Some("idc".into()),
                    }),
                ])
                .max_file_size(1_000_000)
                .rotation_strategy(RotationStrategy::KeepOne)
                .build(),
        )
        .invoke_handler(tauri::generate_handler![
            open_log_folder,
            open_save_folder,
            write_crash_diagnostics
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
