# SavvyBot ProGuard Rules

# Capacitor specific rules
-keep class com.getcapacitor.** { *; }
-keep class com.capacitorjs.plugins.** { *; }

# Keep all WebView related classes
-keep class android.webkit.** { *; }

# Keep all AndroidX classes
-keep class androidx.** { *; }

# Keep all Kotlin classes
-keep class kotlin.** { *; }

# Keep all Java classes
-keep class java.** { *; }

# Keep all javax classes
-keep class javax.** { *; }

# Keep all org classes
-keep class org.** { *; }

# Keep all R (resources) classes
-keep class **.R { *; }
-keep class **.R$* { *; }

# Keep all BuildConfig classes
-keep class **.BuildConfig { *; }

# Keep all Manifest classes
-keep class **.Manifest { *; }

# Keep all MainApplication and MainActivity classes
-keep class com.savvybot.app.** { *; }

# Keep all data classes
-keepclassmembers class * {
    @com.google.gson.annotations.SerializedName <fields>;
}

# Keep all Parcelable classes
-keep class * implements android.os.Parcelable {
    public static final android.os.Parcelable$Creator *;
}

# Keep all Serializable classes
-keepclassmembers class * implements java.io.Serializable {
    static final long serialVersionUID;
    private <fields>;
    private void writeObject(java.io.ObjectOutputStream);
    private void readObject(java.io.ObjectInputStream);
}

# Keep all Retrofit classes
-keep class retrofit2.** { *; }
-keep class okhttp3.** { *; }
-keep class okio.** { *; }

# Keep all Gson classes
-keep class com.google.gson.** { *; }

# Keep all Firebase classes (if used in future)
-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.** { *; }

# Keep all WebSocket classes
-keep class okhttp3.WebSocket { *; }
-keep class okhttp3.WebSocketListener { *; }

# Keep all SSE classes
-keep class okhttp3.sse.** { *; }

# Keep all coroutines classes
-keep class kotlinx.coroutines.** { *; }

# Keep all lifecycle classes
-keep class androidx.lifecycle.** { *; }

# Keep all viewmodel classes
-keep class androidx.lifecycle.ViewModel { *; }
-keep class * extends androidx.lifecycle.ViewModel { *; }

# Keep all livedata classes
-keep class androidx.lifecycle.LiveData { *; }
-keep class * extends androidx.lifecycle.LiveData { *; }

# Keep all room database classes (if used in future)
-keep class androidx.room.** { *; }
-keep class * extends androidx.room.Database { *; }
-keep class * extends androidx.room.Entity { *; }
-keep class * extends androidx.room.Dao { *; }

# Keep all workmanager classes (if used in future)
-keep class androidx.work.** { *; }

# Keep all notification classes
-keep class android.app.Notification { *; }
-keep class android.app.NotificationChannel { *; }
-keep class android.app.NotificationManager { *; }
-keep class androidx.core.app.NotificationCompat { *; }

# Keep all intent classes
-keep class android.content.Intent { *; }
-keep class * extends android.content.BroadcastReceiver { *; }

# Keep all service classes
-keep class * extends android.app.Service { *; }

# Keep all activity classes
-keep class * extends android.app.Activity { *; }

# Keep all fragment classes
-keep class * extends androidx.fragment.app.Fragment { *; }

# Keep all dialog classes
-keep class * extends android.app.Dialog { *; }
-keep class * extends androidx.appcompat.app.AlertDialog { *; }

# Keep all menu classes
-keep class * implements android.view.MenuItem { *; }

# Keep all adapter classes
-keep class * extends android.widget.BaseAdapter { *; }
-keep class * extends androidx.recyclerview.widget.RecyclerView.Adapter { *; }

# Keep all viewholder classes
-keep class * extends androidx.recyclerview.widget.RecyclerView.ViewHolder { *; }

# Keep all view classes
-keep class * extends android.view.View { *; }
-keep class * extends android.view.ViewGroup { *; }

# Keep all widget classes
-keep class * extends android.widget.** { *; }
-keep class * extends androidx.appcompat.widget.** { *; }
-keep class * extends com.google.android.material.** { *; }

# Keep all drawable classes
-keep class * extends android.graphics.drawable.** { *; }

# Keep all animation classes
-keep class * extends android.view.animation.** { *; }
-keep class * extends android.animation.** { *; }

# Keep all bitmap classes
-keep class * extends android.graphics.Bitmap { *; }

# Keep all canvas classes
-keep class * extends android.graphics.Canvas { *; }

# Keep all paint classes
-keep class * extends android.graphics.Paint { *; }

# Keep all path classes
-keep class * extends android.graphics.Path { *; }

# Keep all color classes
-keep class * extends android.graphics.Color { *; }

# Keep all shader classes
-keep class * extends android.graphics.Shader { *; }

# Keep all matrix classes
-keep class * extends android.graphics.Matrix { *; }

# Keep all rect classes
-keep class * extends android.graphics.Rect { *; }
-keep class * extends android.graphics.RectF { *; }

# Keep all point classes
-keep class * extends android.graphics.Point { *; }
-keep class * extends android.graphics.PointF { *; }

# Keep all size classes
-keep class * extends android.util.Size { *; }
-keep class * extends android.util.SizeF { *; }

# Keep all pair classes
-keep class * extends android.util.Pair { *; }

# Keep all sparse array classes
-keep class * extends android.util.SparseArray { *; }
-keep class * extends android.util.SparseBooleanArray { *; }
-keep class * extends android.util.SparseIntArray { *; }
-keep class * extends android.util.SparseLongArray { *; }

# Keep all array map classes
-keep class * extends android.util.ArrayMap { *; }
-keep class * extends android.util.ArraySet { *; }

# Keep all bundle classes
-keep class * extends android.os.Bundle { *; }

# Keep all handler classes
-keep class * extends android.os.Handler { *; }

# Keep all looper classes
-keep class * extends android.os.Looper { *; }

# Keep all message classes
-keep class * extends android.os.Message { *; }

# Keep all runnable classes
-keep class * implements java.lang.Runnable { *; }

# Keep all callable classes
-keep class * implements java.util.concurrent.Callable { *; }

# Keep all future classes
-keep class * implements java.util.concurrent.Future { *; }

# Keep all executor classes
-keep class * implements java.util.concurrent.Executor { *; }

# Keep all thread factory classes
-keep class * implements java.util.concurrent.ThreadFactory { *; }

# Keep all thread pool executor classes
-keep class * extends java.util.concurrent.ThreadPoolExecutor { *; }

# Keep all scheduled executor service classes
-keep class * implements java.util.concurrent.ScheduledExecutorService { *; }

# Keep all atomic classes
-keep class java.util.concurrent.atomic.** { *; }

# Keep all locks classes
-keep class java.util.concurrent.locks.** { *; }

# Keep all concurrent hash map classes
-keep class java.util.concurrent.ConcurrentHashMap { *; }

# Keep all concurrent linked queue classes
-keep class java.util.concurrent.ConcurrentLinkedQueue { *; }

# Keep all copy on write array list classes
-keep class java.util.concurrent.CopyOnWriteArrayList { *; }

# Keep all copy on write array set classes
-keep class java.util.concurrent.CopyOnWriteArraySet { *; }

# Keep all blocking queue classes
-keep class * implements java.util.concurrent.BlockingQueue { *; }

# Keep all count down latch classes
-keep class java.util.concurrent.CountDownLatch { *; }

# Keep all cyclic barrier classes
-keep class java.util.concurrent.CyclicBarrier { *; }

# Keep all semaphore classes
-keep class java.util.concurrent.Semaphore { *; }

# Keep all exchange classes
-keep class java.util.concurrent.Exchanger { *; }

# Keep all phaser classes
-keep class java.util.concurrent.Phaser { *; }

# Keep all fork join pool classes
-keep class java.util.concurrent.ForkJoinPool { *; }

# Keep all fork join task classes
-keep class * extends java.util.concurrent.ForkJoinTask { *; }

# Keep all recursive task classes
-keep class * extends java.util.concurrent.RecursiveTask { *; }

# Keep all recursive action classes
-keep class * extends java.util.concurrent.RecursiveAction { *; }

# Keep all completable future classes
-keep class java.util.concurrent.CompletableFuture { *; }

# Keep all completion stage classes
-keep class * implements java.util.concurrent.CompletionStage { *; }

# Keep all flow classes
-keep class java.util.concurrent.Flow { *; }

# Keep all subscriber classes
-keep class * implements java.util.concurrent.Flow.Subscriber { *; }

# Keep all publisher classes
-keep class * implements java.util.concurrent.Flow.Publisher { *; }

# Keep all processor classes
-keep class * implements java.util.concurrent.Flow.Processor { *; }

# Keep all submission publisher classes
-keep class * implements java.util.concurrent.Flow.SubmissionPublisher { *; }
