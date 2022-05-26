import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class CacheInterceptorService implements HttpInterceptor {

  private static cache = new Map<string, HttpResponse<any>>();

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // check if any cache should be cleared
    const clearCache = req.headers.get('clear-cache')?.split(',');
    if (clearCache) {
      for (const url of clearCache) {
        if (url === 'all') {
          // clear all cache
          this.clearCache();
        } else {
          // clear cache for url
          CacheInterceptorService.cache.delete(url);
        }
      }
    }

    // only intercept get methods
    if (req.method !== 'GET') {
      return next.handle(req);
    }

    // return cached response if cached
    const cached = CacheInterceptorService.cache.get(req.url);
    if (cached) {
      return of(cached.clone());
    }

    // load request
    return next.handle(req)
      .pipe(
        // save response to cache
        tap((httpEvent) => {
          if (httpEvent instanceof HttpResponse)
          CacheInterceptorService.cache.set(req.url, httpEvent.clone());
        })
      );
  }

  clearCache(): void {
    // clear all cache
    CacheInterceptorService.cache.clear();
  }
}
