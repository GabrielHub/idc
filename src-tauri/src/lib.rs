use std::path::PathBuf;

use tauri::Manager;
use tauri_plugin_log::{RotationStrategy, Target, TargetKind};

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
    std::fs::create_dir_all(path).map_err(|err| err.to_string())?;

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

#[tauri::command]
fn open_log_folder(app: tauri::AppHandle) -> Result<(), String> {
    let path = app.path().app_log_dir().map_err(|err| err.to_string())?;
    reveal_in_file_manager(&path)
}

#[tauri::command]
fn open_save_folder(app: tauri::AppHandle) -> Result<(), String> {
    let mut path = app
        .path()
        .app_local_data_dir()
        .map_err(|err| err.to_string())?;
    path.push("saves");
    reveal_in_file_manager(&path)
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
        .invoke_handler(tauri::generate_handler![open_log_folder, open_save_folder])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
