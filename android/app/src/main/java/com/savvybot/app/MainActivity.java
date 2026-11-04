package com.savvybot.app;

import android.os.Bundle;
import android.util.Log;

import com.capacitorjs.plugins.network.NetworkPlugin;
import com.capacitorjs.plugins.preferences.PreferencesPlugin;
import com.capacitorjs.plugins.pushnotifications.PushNotificationsPlugin;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin;

import java.util.ArrayList;

/**
 * SavvyBot Main Activity
 * Custom Android Activity for Capacitor
 */
public class MainActivity extends BridgeActivity {
    
    private static final String TAG = "SavvyBotActivity";
    
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        Log.d(TAG, "SavvyBot Activity created");
        
        // Initialize plugins
        initPlugins();
    }
    
    @Override
    public void onStart() {
        super.onStart();
        Log.d(TAG, "SavvyBot Activity started");
    }
    
    @Override
    public void onResume() {
        super.onResume();
        Log.d(TAG, "SavvyBot Activity resumed");
    }
    
    @Override
    public void onPause() {
        super.onPause();
        Log.d(TAG, "SavvyBot Activity paused");
    }
    
    @Override
    public void onStop() {
        super.onStop();
        Log.d(TAG, "SavvyBot Activity stopped");
    }
    
    @Override
    public void onDestroy() {
        super.onDestroy();
        Log.d(TAG, "SavvyBot Activity destroyed");
    }
    
    /**
     * Initialize Capacitor plugins
     */
    private void initPlugins() {
        // Network plugin for HTTP requests
        addPlugin(new NetworkPlugin());
        
        // Preferences plugin for local storage
        addPlugin(new PreferencesPlugin());
        
        // Push Notifications plugin
        addPlugin(new PushNotificationsPlugin());
    }
    
    /**
     * Add a plugin to the bridge
     */
    private void addPlugin(Plugin plugin) {
        try {
            this.bridge.addPlugin(plugin);
            Log.d(TAG, "Plugin added: " + plugin.getClass().getSimpleName());
        } catch (Exception e) {
            Log.e(TAG, "Error adding plugin: " + plugin.getClass().getSimpleName(), e);
        }
    }
}
