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

    // 콘솔에 성능 정보 출력
    console.log(`⏱️ Performance: ${operationId} took ${duration.toFixed(2)}ms`, metadata);
    
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

    // 성능 분석 로그
    console.group('🔍 최적화 성능 분석');
    console.log('📊 기본 정보:', {
      장소수: locationCount,
      경유지수: waypointCount,
      방법: method,
      소요시간: `${duration.toFixed(0)}ms`
    });
    console.log('🌐 API 효율성:', {
      API호출수: apiCalls,
      평균응답시간: `${(duration / apiCalls).toFixed(0)}ms`,
      초당호출수: metric.efficiency.toFixed(2)
    });
    if (iterations > 0) {
      console.log('🔄 최적화 반복:', {
        반복횟수: iterations,
        반복당시간: `${(duration / iterations).toFixed(0)}ms`
      });
    }
    console.groupEnd();

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

      console.log(`💾 Memory (${operationId}):`, {
        사용량: `${(memory.used / 1024 / 1024).toFixed(1)}MB`,
        총용량: `${(memory.total / 1024 / 1024).toFixed(1)}MB`,
        사용률: `${((memory.used / memory.total) * 100).toFixed(1)}%`
      });

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
      console.log('📈 성능 리포트: 데이터가 없습니다.');
      return;
    }

    console.group('📈 성능 리포트');
    console.log('🔄 최적화 작업:', {
      총횟수: optimizationStats.count,
      평균시간: `${optimizationStats.duration.avg.toFixed(0)}ms`,
      최대시간: `${optimizationStats.duration.max.toFixed(0)}ms`,
      총시간: `${optimizationStats.duration.total.toFixed(0)}ms`
    });
    console.log('🌐 API 호출:', {
      평균호출수: optimizationStats.apiCalls.avg.toFixed(1),
      최대호출수: optimizationStats.apiCalls.max,
      총호출수: optimizationStats.apiCalls.total
    });
    
    // 방법별 통계
    const methodStats = this.getMethodStats();
    if (methodStats.size > 0) {
      console.log('⚙️ 방법별 성능:');
      methodStats.forEach((stats, method) => {
        console.log(`  ${method}:`, {
          사용횟수: stats.count,
          평균시간: `${stats.avgDuration.toFixed(0)}ms`,
          평균API: stats.avgApiCalls.toFixed(1)
        });
      });
    }
    console.groupEnd();
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
    console.log('🧹 성능 데이터가 초기화되었습니다.');
  }
}

// 전역 인스턴스 생성
export const performanceMonitor = new PerformanceMonitor();

// 개발 환경에서만 전역 객체에 노출
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  window.performanceMonitor = performanceMonitor;
}

export default PerformanceMonitor;
