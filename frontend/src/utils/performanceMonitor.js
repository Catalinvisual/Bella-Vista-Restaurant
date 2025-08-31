// Performance monitoring utility
class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.observers = [];
    this.initObservers();
  }

  // Initialize performance observers
  initObservers() {
    if ('PerformanceObserver' in window) {
      // Monitor navigation timing
      const navObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric('navigation', {
            type: entry.type,
            duration: entry.duration,
            loadEventEnd: entry.loadEventEnd,
            domContentLoadedEventEnd: entry.domContentLoadedEventEnd
          });
        }
      });
      navObserver.observe({ entryTypes: ['navigation'] });
      this.observers.push(navObserver);

      // Monitor resource loading
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name.includes('api') || entry.name.includes('menu')) {
            this.recordMetric('api-call', {
              url: entry.name,
              duration: entry.duration,
              transferSize: entry.transferSize || 0
            });
          }
        }
      });
      resourceObserver.observe({ entryTypes: ['resource'] });
      this.observers.push(resourceObserver);
    }
  }

  // Record a custom metric
  recordMetric(name, data) {
    const timestamp = Date.now();
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name).push({ ...data, timestamp });
    
    // Log slow operations in development
    if (process.env.NODE_ENV === 'development') {
      if (data.duration > 1000) {
        console.warn(`Slow operation detected: ${name}`, data);
      }
    }
  }

  // Start timing a custom operation
  startTiming(name) {
    const startTime = performance.now();
    return {
      end: (additionalData = {}) => {
        const duration = performance.now() - startTime;
        this.recordMetric(name, { duration, ...additionalData });
        return duration;
      }
    };
  }

  // Get metrics for a specific operation
  getMetrics(name) {
    return this.metrics.get(name) || [];
  }

  // Get average duration for an operation
  getAverageDuration(name) {
    const metrics = this.getMetrics(name);
    if (metrics.length === 0) return 0;
    const total = metrics.reduce((sum, metric) => sum + (metric.duration || 0), 0);
    return total / metrics.length;
  }

  // Get performance summary
  getSummary() {
    const summary = {};
    for (const [name, metrics] of this.metrics.entries()) {
      summary[name] = {
        count: metrics.length,
        averageDuration: this.getAverageDuration(name),
        lastRecorded: metrics[metrics.length - 1]?.timestamp
      };
    }
    return summary;
  }

  // Clear all metrics
  clear() {
    this.metrics.clear();
  }

  // Cleanup observers
  destroy() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.clear();
  }
}

// Create singleton instance
const performanceMonitor = new PerformanceMonitor();

// React hook for component performance monitoring
export const usePerformanceMonitor = (componentName) => {
  const React = require('react');
  
  React.useEffect(() => {
    const timer = performanceMonitor.startTiming(`component-${componentName}`);
    return () => {
      timer.end();
    };
  }, [componentName]);

  return {
    recordMetric: (name, data) => performanceMonitor.recordMetric(`${componentName}-${name}`, data),
    startTiming: (name) => performanceMonitor.startTiming(`${componentName}-${name}`)
  };
};

export default performanceMonitor;