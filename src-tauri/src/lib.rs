use std::fs;
use std::path::Path;

#[tauri::command]
fn read_dropped_file(path: String) -> Result<String, String> {
    let p = Path::new(&path);
    if !p.is_file() {
        return Err("Keine Datei".into());
    }
    let ext = p
        .extension()
        .and_then(|e| e.to_str())
        .map(|s| s.to_lowercase());
    let allowed = matches!(
        ext.as_deref(),
        Some("json") | Some("xml") | Some("xsl") | Some("yaml") | Some("yml") | Some("txt")
    );
    if !allowed {
        return Err("Nur .json, .xml, .xsl, .yaml, .yml oder .txt erlaubt".into());
    }
    fs::read_to_string(&path).map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![read_dropped_file])
        .setup(|app| {
            #[cfg(debug_assertions)]
            {
                let _window = app.get_webview_window("main").unwrap();
                _window.open_devtools();
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
