// Small edits to the generated Android project (it is recreated on every CI run).
import { readFileSync, writeFileSync } from "node:fs";

// 1) landscape only; permission for the lock-screen player service
const mf = "android/app/src/main/AndroidManifest.xml";
let m = readFileSync(mf, "utf8");
// orientation is chosen at runtime by the page (phones: portrait, videos and tablets: landscape)
// Android 14+: a mediaPlayback foreground service (lock-screen player) needs its own permission
if (!m.includes("FOREGROUND_SERVICE_MEDIA_PLAYBACK"))
  m = m.replace(/<application\b/, '<uses-permission android:name="android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK" />\n    <application');
writeFileSync(mf, m);

// 2) versionCode from CI (-PversionCode), versionName from package.json
const pkg = JSON.parse(readFileSync("package.json", "utf8"));
const gf = "android/app/build.gradle";
let g = readFileSync(gf, "utf8");
g = g.replace(/versionCode \d+/, 'versionCode Integer.parseInt((project.findProperty("versionCode") ?: "1").toString())');
g = g.replace(/versionName "[^"]*"/, `versionName "${pkg.version}"`);
// big media must stay uncompressed inside the APK so the WebView can stream and seek it
if (!g.includes("noCompress"))
  g = g.replace(/android\s*\{/, `android {\n    androidResources { noCompress 'mp3', 'mp4', 'webp', 'woff', 'otf' }`);
writeFileSync(gf, g);

// 3) immersive full screen (hide status and navigation bars)
const fs = await import("node:fs");
const path = await import("node:path");
const javaRoot = "android/app/src/main/java";
const find = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) =>
  e.isDirectory() ? find(path.join(d, e.name)) : e.name === "MainActivity.java" ? [path.join(d, e.name)] : []);
for (const f of find(javaRoot)) {
  let src = fs.readFileSync(f, "utf8");
  if (src.includes("onWindowFocusChanged")) continue;
  src = src.replace("import com.getcapacitor.BridgeActivity;",
    `import com.getcapacitor.BridgeActivity;
import android.view.View;
import android.view.WindowManager;`);
  src = src.replace(/public class MainActivity extends BridgeActivity \{\s*\}/,
    `public class MainActivity extends BridgeActivity {
    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            getWindow().getDecorView().setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_FULLSCREEN);
        }
    }
}`);
  fs.writeFileSync(f, src);
}
// 4) tiny native plugin: the page asks for portrait (phone layout) or landscape (videos, tablets)
for (const f of find(javaRoot)) {
  const dir = path.dirname(f);
  const pkg = fs.readFileSync(f, "utf8").match(/^package\s+([\w.]+);/m)[1];
  fs.writeFileSync(path.join(dir, "FawnOrientPlugin.java"), `package ${pkg};

import android.content.pm.ActivityInfo;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "FawnOrient")
public class FawnOrientPlugin extends Plugin {
    @PluginMethod
    public void set(PluginCall call) {
        final String m = call.getString("mode", "landscape");
        final int o = "portrait".equals(m) ? ActivityInfo.SCREEN_ORIENTATION_SENSOR_PORTRAIT
            : "free".equals(m) ? ActivityInfo.SCREEN_ORIENTATION_FULL_USER
            : ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE;
        getActivity().runOnUiThread(() -> { getActivity().setRequestedOrientation(o); call.resolve(); });
    }
}
`);
  let src = fs.readFileSync(f, "utf8");
  if (!src.includes("FawnOrientPlugin.class")) {
    src = src.replace("import com.getcapacitor.BridgeActivity;", "import com.getcapacitor.BridgeActivity;\nimport android.os.Bundle;");
    src = src.replace(/public class MainActivity extends BridgeActivity \{/,
      `public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(FawnOrientPlugin.class);
        super.onCreate(savedInstanceState);
    }
`);
    fs.writeFileSync(f, src);
  }
}
console.log("android tweaks applied");
