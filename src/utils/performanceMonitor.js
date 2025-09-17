/**
 * 성능 모니터링 유틸리티
 * 최적화 알고리즘의 성능을 추적하고 분석
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = [];
    this.startTimes = new Map();
  }

  /**
   * 작업 시작 시간 기록
   */
  startTimer(operationId) {
    this.startTimes.set(operationId, performance.now());
  }

  /**
   * 작업 완료 시간 기록 및 메트릭 저장
   */
  endTimer(operationId, metadata = {}) {
    const startTime = this.startTimes.get(operationId);
    if (!startTime) {
      console.warn(`No start time found for operation: ${operationId}`);
      return null;
    }

    const duration = performance.now() - startTime;
    const metric = {
      operationId,
      duration,
      timestamp: new Date().toISOString(),
      ...metadata
    };

    this.metrics.push(metric);
    this.startTimes.delete(operationId);
    
    return metric;
  }

  /**
   * 최적화 작업 성능 추적
   */
  trackOptimization(locationCount, waypointCount, method, apiCalls, duration, iterations = 0) {
    const metric = {
      operationId: 'route_optimization',
      locationCount,
      waypointCount,
      method,
      apiCalls,
      duration,
      iterations,
      timestamp: new Date().toISOString(),
      efficiency: duration > 0 ? apiCalls / (duration / 1000) : 0 // API calls per second
    };

    this.metrics.push(metric);

    return metric;
  }

  /**
   * 성능 통계 조회
   */
  getStats(operationId = null) {
    const filteredMetrics = operationId 
      ? this.metrics.filter(m => m.operationId === operationId)
      : this.metrics;

    if (filteredMetrics.length === 0) {
      return null;
    }

    const durations = filteredMetrics.map(m => m.duration);
    const apiCalls = filteredMetrics.map(m => m.apiCalls || 0);

    return {
      count: filteredMetrics.length,
      duration: {
        min: Math.min(...durations),
        max: Math.max(...durations),
        avg: durations.reduce((a, b) => a + b, 0) / durations.length,
        total: durations.reduce((a, b) => a + b, 0)
      },
      apiCalls: {
        min: Math.min(...apiCalls),
        max: Math.max(...apiCalls),
        avg: apiCalls.reduce((a, b) => a + b, 0) / apiCalls.length,
        total: apiCalls.reduce((a, b) => a + b, 0)
      }
    };
  }

  /**
   * 메모리 사용량 추적
   */
  trackMemoryUsage(operationId) {
    if (performance.memory) {
      const memory = {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit
      };

      return memory;
    }
    return null;
  }

  /**
   * 성능 리포트 생성
   */
  generateReport() {
    const optimizationStats = this.getStats('route_optimization');
    
    if (!optimizationStats) {
      return;
    }

    // 성능 리포트는 프로덕션에서는 출력하지 않음
  }

  /**
   * 방법별 통계 계산
   */
  getMethodStats() {
    const methodMap = new Map();
    
    this.metrics
      .filter(m => m.operationId === 'route_optimization' && m.method)
      .forEach(metric => {
        if (!methodMap.has(metric.method)) {
          methodMap.set(metric.method, []);
        }
        methodMap.get(metric.method).push(metric);
      });

    const result = new Map();
    methodMap.forEach((metrics, method) => {
      const totalDuration = metrics.reduce((sum, m) => sum + m.duration, 0);
      const totalApiCalls = metrics.reduce((sum, m) => sum + (m.apiCalls || 0), 0);
      
      result.set(method, {
        count: metrics.length,
        avgDuration: totalDuration / metrics.length,
        avgApiCalls: totalApiCalls / metrics.length
      });
    });

    return result;
  }

  /**
   * 성능 데이터 내보내기 (개발용)
   */
  exportData() {
    return {
      metrics: this.metrics,
      stats: this.getStats(),
      methodStats: Object.fromEntries(this.getMethodStats()),
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * 성능 데이터 초기화
   */
  clear() {
    this.metrics = [];
    this.startTimes.clear();
  }
}

// 전역 인스턴스 생성
export const performanceMonitor = new PerformanceMonitor();

// 개발 환경에서만 전역 객체에 노출
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  window.performanceMonitor = performanceMonitor;
}

export default PerformanceMonitor;
