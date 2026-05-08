use tauri::Manager;
use tauri_plugin_log::{RotationStrategy, Target, TargetKind};

#[tauri::command]
fn open_log_folder(app: tauri::AppHandle) -> Result<(), String> {
    let path = app.path().app_log_dir().map_err(|err| err.to_string())?;
    std::fs::create_dir_all(&path).map_err(|err| err.to_string())?;

    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("explorer")
            .arg(&path)
            .spawn()
            .map_err(|err| err.to_string())?;
    }
    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(&path)
            .spawn()
            .map_err(|err| err.to_string())?;
    }
    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open")
            .arg(&path)
            .spawn()
            .map_err(|err| err.to_string())?;
    }

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(
            tauri_plugin_log::Builder::default()
                .level(log::LevelFilter::Info)
                .targets([
                    Target::new(TargetKind::Stdout),
                    Target::new(TargetKind::LogDir {
                        file_name: Some("idc-cupid".into()),
                    }),
                ])
                .max_file_size(1_000_000)
                .rotation_strategy(RotationStrategy::KeepOne)
                .build(),
        )
        .invoke_handler(tauri::generate_handler![open_log_folder])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
