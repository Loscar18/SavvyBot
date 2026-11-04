package com.savvybot.app;

import android.app.Application;
import android.util.Log;

import com.capacitorjs.plugins.network.NetworkPlugin;
import com.capacitorjs.plugins.preferences.PreferencesPlugin;
import com.capacitorjs.plugins.pushnotifications.PushNotificationsPlugin;

/**
 * SavvyBot Main Application
 * Custom Android Application class for Capacitor
 */
public class MainApplication extends Application {
    
    private static final String TAG = "SavvyBotApp";
    
    @Override
    public void onCreate() {
        super.onCreate();
        
        Log.d(TAG, "SavvyBot Application started");
        
        // Initialize Capacitor plugins
        // These are registered automatically by Capacitor
    }
}
