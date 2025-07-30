import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDebounce, useDebouncedCallback, debounce } from '@/lib/use-debounce'

describe('Debounce Utilities', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('useDebounce hook', () => {
    it('should debounce value changes', () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        {
          initialProps: { value: 'initial', delay: 300 }
        }
      )

      // Initial value should be set immediately
      expect(result.current).toBe('initial')

      // Change value
      rerender({ value: 'updated', delay: 300 })
      
      // Value should not change immediately
      expect(result.current).toBe('initial')

      // Fast forward time by 299ms (just before delay)
      act(() => {
        vi.advanceTimersByTime(299)
      })
      expect(result.current).toBe('initial')

      // Fast forward by 1ms more (completing the delay)
      act(() => {
        vi.advanceTimersByTime(1)
      })
      expect(result.current).toBe('updated')
    })

    it('should reset timer on rapid value changes', () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        {
          initialProps: { value: 'initial', delay: 300 }
        }
      )

      // Rapid changes
      rerender({ value: 'change1', delay: 300 })
      act(() => { vi.advanceTimersByTime(100) })
      
      rerender({ value: 'change2', delay: 300 })
      act(() => { vi.advanceTimersByTime(100) })
      
      rerender({ value: 'final', delay: 300 })
      
      // Should still be initial value
      expect(result.current).toBe('initial')

      // Complete the delay
      act(() => {
        vi.advanceTimersByTime(300)
      })
      
      // Should be the final value
      expect(result.current).toBe('final')
    })
  })

  describe('useDebouncedCallback hook', () => {
    it('should debounce callback execution', () => {
      const mockCallback = vi.fn()
      const { result } = renderHook(() => 
        useDebouncedCallback(mockCallback, 300)
      )

      // Call the debounced function multiple times
      act(() => {
        result.current('arg1')
        result.current('arg2')
        result.current('arg3')
      })

      // Callback should not be called yet
      expect(mockCallback).not.toHaveBeenCalled()

      // Fast forward time
      act(() => {
        vi.advanceTimersByTime(300)
      })

      // Callback should be called once with the last arguments
      expect(mockCallback).toHaveBeenCalledTimes(1)
      expect(mockCallback).toHaveBeenCalledWith('arg3')
    })

    it('should update callback reference without affecting debouncing', () => {
      const mockCallback1 = vi.fn()
      const mockCallback2 = vi.fn()
      
      const { result, rerender } = renderHook(
        ({ callback }) => useDebouncedCallback(callback, 300),
        { initialProps: { callback: mockCallback1 } }
      )

      // Call with first callback
      act(() => {
        result.current('test')
      })

      // Change callback before delay completes
      rerender({ callback: mockCallback2 })

      // Complete delay
      act(() => {
        vi.advanceTimersByTime(300)
      })

      // Should call the updated callback
      expect(mockCallback1).not.toHaveBeenCalled()
      expect(mockCallback2).toHaveBeenCalledWith('test')
    })
  })

  describe('debounce utility function', () => {
    it('should debounce function calls', () => {
      const mockFn = vi.fn()
      const debouncedFn = debounce(mockFn, 300)

      // Multiple rapid calls
      debouncedFn('arg1')
      debouncedFn('arg2')
      debouncedFn('arg3')

      expect(mockFn).not.toHaveBeenCalled()

      // Fast forward time
      vi.advanceTimersByTime(300)

      expect(mockFn).toHaveBeenCalledTimes(1)
      expect(mockFn).toHaveBeenCalledWith('arg3')
    })

    it('should allow cancellation of debounced calls', () => {
      const mockFn = vi.fn()
      const debouncedFn = debounce(mockFn, 300)

      debouncedFn('test')
      debouncedFn.cancel()

      vi.advanceTimersByTime(300)

      expect(mockFn).not.toHaveBeenCalled()
    })

    it('should handle multiple independent debounced functions', () => {
      const mockFn1 = vi.fn()
      const mockFn2 = vi.fn()
      const debouncedFn1 = debounce(mockFn1, 200)
      const debouncedFn2 = debounce(mockFn2, 400)

      debouncedFn1('fn1')
      debouncedFn2('fn2')

      // Fast forward to first function's delay
      vi.advanceTimersByTime(200)
      expect(mockFn1).toHaveBeenCalledWith('fn1')
      expect(mockFn2).not.toHaveBeenCalled()

      // Fast forward to second function's delay
      vi.advanceTimersByTime(200)
      expect(mockFn2).toHaveBeenCalledWith('fn2')
    })
  })

  describe('Search and Filter Debouncing Integration', () => {
    it('should simulate search input debouncing behavior', () => {
      const mockSearchHandler = vi.fn()
      const debouncedSearch = debounce(mockSearchHandler, 300)

      // Simulate typing "hello" character by character
      const searchTerms = ['h', 'he', 'hel', 'hell', 'hello']
      
      searchTerms.forEach(term => {
        debouncedSearch(term)
        vi.advanceTimersByTime(50) // 50ms between keystrokes
      })

      // Should not have been called yet (total time: 250ms < 300ms delay)
      expect(mockSearchHandler).not.toHaveBeenCalled()

      // Complete the debounce delay
      vi.advanceTimersByTime(300)

      // Should be called once with the final search term
      expect(mockSearchHandler).toHaveBeenCalledTimes(1)
      expect(mockSearchHandler).toHaveBeenCalledWith('hello')
    })

    it('should simulate filter changes with different delays', () => {
      const mockSearchHandler = vi.fn()
      const mockFilterHandler = vi.fn()
      
      const debouncedSearch = debounce(mockSearchHandler, 300)
      const debouncedFilter = debounce(mockFilterHandler, 500)

      // Simulate simultaneous search and filter changes
      debouncedSearch('search term')
      debouncedFilter({ status: 'active' })

      // Fast forward to search delay
      vi.advanceTimersByTime(300)
      expect(mockSearchHandler).toHaveBeenCalledWith('search term')
      expect(mockFilterHandler).not.toHaveBeenCalled()

      // Fast forward to filter delay
      vi.advanceTimersByTime(200)
      expect(mockFilterHandler).toHaveBeenCalledWith({ status: 'active' })
    })
  })
})