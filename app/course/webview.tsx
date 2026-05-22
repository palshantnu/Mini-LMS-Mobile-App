import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { WebView, WebViewMessageEvent, WebViewNavigation } from "react-native-webview";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../../store/authStore";
import { useBookmarkStore } from "../../store/bookmarkStore";
import { WebViewMessage } from "../../types";
import { COLORS } from "../../constants";

function buildCourseHTML(params: Record<string, string>, isEnrolled: boolean): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />
  <title>${params.title ?? "Course"}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #f8fafc;
      color: #0f172a;
      min-height: 100vh;
    }
    .hero {
      background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
      padding: 32px 20px 48px;
      position: relative;
      overflow: hidden;
    }
    .hero::before {
      content: '';
      position: absolute;
      top: -50%;
      right: -20%;
      width: 300px;
      height: 300px;
      background: rgba(255,255,255,0.08);
      border-radius: 50%;
    }
    .category-badge {
      display: inline-block;
      background: rgba(255,255,255,0.2);
      color: white;
      font-size: 11px;
      font-weight: 600;
      padding: 4px 12px;
      border-radius: 999px;
      margin-bottom: 12px;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .hero h1 {
      color: white;
      font-size: 22px;
      font-weight: 700;
      line-height: 1.3;
      margin-bottom: 20px;
    }
    .instructor {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .instructor img {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: 2px solid rgba(255,255,255,0.5);
      object-fit: cover;
    }
    .instructor-info span {
      display: block;
      color: rgba(255,255,255,0.9);
      font-size: 13px;
      font-weight: 600;
    }
    .instructor-info small {
      color: rgba(255,255,255,0.6);
      font-size: 11px;
    }
    .stats {
      display: flex;
      gap: 12px;
      margin: 20px;
      margin-top: -24px;
    }
    .stat {
      flex: 1;
      background: white;
      border-radius: 12px;
      padding: 14px 10px;
      text-align: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }
    .stat-value {
      font-size: 18px;
      font-weight: 700;
      color: #6366f1;
      display: block;
    }
    .stat-label {
      font-size: 10px;
      color: #94a3b8;
      margin-top: 2px;
      font-weight: 500;
    }
    .section {
      margin: 0 20px 20px;
      background: white;
      border-radius: 16px;
      padding: 20px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    }
    .section h2 {
      font-size: 16px;
      font-weight: 700;
      margin-bottom: 12px;
      color: #0f172a;
    }
    .section p {
      font-size: 14px;
      line-height: 1.7;
      color: #475569;
    }
    .curriculum-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 0;
      border-bottom: 1px solid #f1f5f9;
    }
    .curriculum-item:last-child { border-bottom: none; }
    .lesson-icon {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      background: #eef2ff;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .lesson-icon svg { width: 18px; height: 18px; }
    .lesson-info { flex: 1; }
    .lesson-title {
      font-size: 13px;
      font-weight: 600;
      color: #0f172a;
    }
    .lesson-duration {
      font-size: 11px;
      color: #94a3b8;
      margin-top: 2px;
    }
    .enrolled-banner {
      margin: 0 20px 16px;
      background: #dcfce7;
      border: 1px solid #86efac;
      border-radius: 12px;
      padding: 12px 16px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .enrolled-banner span {
      font-size: 13px;
      font-weight: 600;
      color: #15803d;
    }
    .action-btn {
      display: block;
      width: calc(100% - 40px);
      margin: 0 20px 32px;
      padding: 16px;
      border-radius: 14px;
      text-align: center;
      font-size: 15px;
      font-weight: 700;
      border: none;
      cursor: pointer;
      transition: opacity 0.2s;
    }
    .btn-primary { background: #6366f1; color: white; }
    .btn-secondary { background: #eef2ff; color: #6366f1; }
    .action-btn:active { opacity: 0.85; }
  </style>
</head>
<body>
  <div class="hero">
    <div class="category-badge">${params.category ?? "Course"}</div>
    <h1>${params.title ?? "Course Title"}</h1>
    <div class="instructor">
      <img src="${params.instructorAvatar ?? ""}" alt="${params.instructorName ?? ""}" onerror="this.style.display='none'" />
      <div class="instructor-info">
        <span>${params.instructorName ?? "Instructor"}</span>
        <small>${params.level ?? "Beginner"} Level</small>
      </div>
    </div>
  </div>

  <div class="stats">
    <div class="stat">
      <span class="stat-value">⭐ ${params.rating ?? "4.5"}</span>
      <span class="stat-label">Rating</span>
    </div>
    <div class="stat">
      <span class="stat-value">${params.duration ?? "N/A"}</span>
      <span class="stat-label">Duration</span>
    </div>
    <div class="stat">
      <span class="stat-value">$${params.price ?? "0"}</span>
      <span class="stat-label">Price</span>
    </div>
  </div>

  ${
    isEnrolled
      ? `<div class="enrolled-banner">
    <svg viewBox="0 0 24 24" fill="none" width="20" height="20"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#15803d" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
    <span>You are enrolled in this course</span>
  </div>`
      : ""
  }

  <div class="section">
    <h2>About this Course</h2>
    <p>${params.description ?? "No description available."}</p>
  </div>

  <div class="section">
    <h2>Course Curriculum</h2>
    ${generateCurriculum()}
  </div>

  ${
    !isEnrolled
      ? `<button class="action-btn btn-primary" onclick="enrollNow()">Enroll Now — $${params.price ?? "0"}</button>`
      : `<button class="action-btn btn-secondary" onclick="startLearning()">Continue Learning</button>`
  }

  <script>
    function enrollNow() {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'ENROLL',
        payload: { courseId: '${params.id ?? ""}' }
      }));
    }
    function startLearning() {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'START_LEARNING',
        payload: { courseId: '${params.id ?? ""}' }
      }));
    }
    document.addEventListener('DOMContentLoaded', function() {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'READY' }));
    });
  </script>
</body>
</html>`;
}

function generateCurriculum(): string {
  const lessons = [
    { title: "Introduction & Overview", duration: "12 min" },
    { title: "Core Fundamentals", duration: "28 min" },
    { title: "Practical Application", duration: "35 min" },
    { title: "Advanced Techniques", duration: "42 min" },
    { title: "Real-World Project", duration: "55 min" },
    { title: "Final Assessment & Summary", duration: "18 min" },
  ];

  return lessons
    .map(
      (lesson, i) => `
    <div class="curriculum-item">
      <div class="lesson-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <polygon points="10,8 16,12 10,16" fill="#6366f1" stroke="none"/>
        </svg>
      </div>
      <div class="lesson-info">
        <div class="lesson-title">${i + 1}. ${lesson.title}</div>
        <div class="lesson-duration">${lesson.duration}</div>
      </div>
    </div>`
    )
    .join("");
}

export default function CourseWebViewScreen() {
  const params = useLocalSearchParams<Record<string, string>>();
  const user = useAuthStore((s) => s.user);
  const isEnrolled = useBookmarkStore((s) => s.isEnrolled);
  const enrollCourse = useBookmarkStore((s) => s.enrollCourse);
  const webViewRef = useRef<WebView>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [canGoBack, setCanGoBack] = useState(false);
  const [progress, setProgress] = useState(0);

  const enrolled = isEnrolled(params.id ?? "");

  const htmlContent = buildCourseHTML(params as Record<string, string>, enrolled);

  const injectedJS = `
    (function() {
      window.__APP_USER__ = ${JSON.stringify({
        name: user?.fullName ?? "",
        email: user?.email ?? "",
        isEnrolled: enrolled,
      })};
      true;
    })();
  `;

  const handleMessage = useCallback(
    async (event: WebViewMessageEvent) => {
      try {
        const message = JSON.parse(event.nativeEvent.data) as WebViewMessage;
        if (message.type === "ENROLL" && params.id) {
          await enrollCourse(params.id);
          const script = `
            document.querySelector('.action-btn.btn-primary').outerHTML =
              '<button class="action-btn btn-secondary">Continue Learning</button>';
            var existing = document.querySelector('.enrolled-banner');
            if (!existing) {
              var banner = document.createElement('div');
              banner.className = 'enrolled-banner';
              banner.innerHTML = '<span>You are enrolled in this course</span>';
              document.querySelector('.stats').after(banner);
            }
            true;
          `;
          webViewRef.current?.injectJavaScript(script);
        }
      } catch {
        // ignore malformed messages
      }
    },
    [params.id, enrollCourse]
  );

  const handleNavigationChange = useCallback((navState: WebViewNavigation) => {
    setCanGoBack(navState.canGoBack);
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <View className="flex-row items-center px-4 py-3 bg-white border-b border-slate-100">
        <Pressable
          onPress={() => {
            if (canGoBack) {
              webViewRef.current?.goBack();
            } else {
              router.back();
            }
          }}
          className="w-10 h-10 rounded-full bg-slate-100 items-center justify-center mr-3"
          hitSlop={8}
        >
          <Ionicons name="arrow-back" size={20} color={COLORS.textPrimary} />
        </Pressable>

        <View className="flex-1">
          <Text className="text-text-primary font-semibold text-sm" numberOfLines={1}>
            {params.title ?? "Course Preview"}
          </Text>
          <Text className="text-text-muted text-xs">{params.instructorName ?? ""}</Text>
        </View>

        <Pressable
          onPress={() => webViewRef.current?.reload()}
          className="w-10 h-10 rounded-full bg-slate-100 items-center justify-center"
          hitSlop={8}
        >
          <Ionicons name="refresh-outline" size={18} color={COLORS.textPrimary} />
        </Pressable>
      </View>

      {isLoading && (
        <View
          style={{
            height: 3,
            backgroundColor: COLORS.primaryLight,
            position: "absolute",
            top: Platform.OS === "ios" ? 100 : 66,
            left: 0,
            right: 0,
            zIndex: 10,
          }}
        >
          <View
            style={{
              height: "100%",
              width: `${progress * 100}%`,
              backgroundColor: COLORS.primary,
            }}
          />
        </View>
      )}

      {hasError ? (
        <View className="flex-1 items-center justify-center p-8">
          <Ionicons name="cloud-offline-outline" size={56} color={COLORS.textMuted} />
          <Text className="text-text-primary text-lg font-semibold mt-4">
            Failed to load content
          </Text>
          <Text className="text-text-secondary text-sm mt-2 text-center">
            Unable to load the course content. Please check your connection.
          </Text>
          <TouchableOpacity
            onPress={() => {
              setHasError(false);
              webViewRef.current?.reload();
            }}
            className="mt-6 bg-primary-500 px-8 py-3 rounded-xl"
          >
            <Text className="text-white font-semibold">Reload</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <WebView
          ref={webViewRef}
          source={{ html: htmlContent }}
          injectedJavaScript={injectedJS}
          onMessage={handleMessage}
          onNavigationStateChange={handleNavigationChange}
          onLoadStart={() => {
            setIsLoading(true);
            setHasError(false);
          }}
          onLoadEnd={() => setIsLoading(false)}
          onLoadProgress={({ nativeEvent }) => setProgress(nativeEvent.progress)}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
          }}
          onHttpError={() => {
            setIsLoading(false);
            setHasError(true);
          }}
          javaScriptEnabled
          domStorageEnabled
          startInLoadingState={false}
          showsVerticalScrollIndicator={false}
          scrollEnabled
          allowsBackForwardNavigationGestures
          originWhitelist={["*"]}
          renderLoading={() => (
            <View className="absolute inset-0 items-center justify-center bg-white">
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}
