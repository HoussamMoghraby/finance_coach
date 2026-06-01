---
name: performance-review
description: Python performance review skills for analyzing and optimizing code efficiency, memory usage, and scalability.
---

<!-- Tip: Use /create-skill in chat to generate content with agent assistance -->

# Python Performance Review Skills

## 1. Algorithmic Efficiency
- Analyze time and space complexity (Big-O)
- Prefer optimal data structures (e.g., dict/set over list for lookups)
- Avoid nested loops when unnecessary
- Identify redundant computations and repeated work
- Use memoization or caching where applicable

## 2. Data Structures Optimization
- Use appropriate built-in types (list, dict, set, tuple)
- Prefer collections (defaultdict, deque, Counter) when suitable
- Avoid unnecessary data copying
- Optimize large data transformations

## 3. Memory Management
- Minimize memory footprint for large datasets
- Use generators instead of lists when possible
- Avoid memory leaks (circular references, large unused objects)
- Use `__slots__` for lightweight classes when needed

## 4. Pythonic Performance Patterns
- Prefer list/dict/set comprehensions over loops
- Use built-in functions (`map`, `filter`, `sum`, `any`, `all`)
- Avoid excessive object creation inside loops
- Leverage unpacking and tuple assignment

## 5. I/O Optimization
- Reduce disk and network calls
- Use buffered reading/writing
- Batch operations instead of frequent small calls
- Use async I/O when beneficial

## 6. Concurrency & Parallelism
- Use `threading` for I/O-bound tasks
- Use `multiprocessing` for CPU-bound tasks
- Avoid GIL bottlenecks where possible
- Use async/await for scalable I/O operations

## 7. Database & External Calls Optimization
- Avoid N+1 queries
- Use bulk operations (bulk insert/update)
- Optimize ORM queries (select_related, prefetch_related)
- Cache frequent queries (Redis, in-memory)

## 8. Profiling & Benchmarking
- Use profiling tools (`cProfile`, `line_profiler`)
- Benchmark critical paths
- Identify bottlenecks before optimizing
- Avoid premature optimization

## 9. Caching Strategies
- Apply in-memory caching (lru_cache)
- Use distributed caching when needed (Redis)
- Cache expensive computations and API responses
- Handle cache invalidation correctly

## 10. Error Handling & Resilience
- Avoid expensive exception handling in hot paths
- Validate inputs early
- Fail fast for invalid states

## 11. Dependency & Library Efficiency
- Avoid heavy libraries for simple tasks
- Prefer optimized libraries (NumPy, Pandas when applicable)
- Keep dependencies minimal and efficient

## 12. Code Scalability & Maintainability
- Write modular and reusable functions
- Avoid over-engineering
- Balance readability with performance
- Document performance-critical decisions

## 13. Logging & Monitoring
- Avoid excessive logging in performance-critical paths
- Use appropriate log levels
- Ensure logging does not block execution

## 14. Security vs Performance Trade-offs
- Avoid unsafe optimizations
- Balance performance with security best practices

## 15. Review Checklist (Quick Scan)
- Is the algorithm optimal?
- Are data structures appropriate?
- Any redundant computations?
- Any unnecessary I/O calls?
- Any memory inefficiencies?
- Any blocking operations that can be async?
- Any caching opportunities?
- Any obvious bottlenecks?
