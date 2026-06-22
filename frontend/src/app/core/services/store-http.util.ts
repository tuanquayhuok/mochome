import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';
import { API_URL } from '../config/api-url';

/** Gọi GET lần lượt các path (tương thích backend cũ / mới). */
export function getWithPathFallback<T>(http: HttpClient, paths: readonly string[]): Observable<T> {
  const tryPath = (index: number): Observable<T> => {
    const path = paths[index];
    return http.get<T>(`${API_URL}${path}`).pipe(
      catchError((err: HttpErrorResponse) => {
        const canRetry = index < paths.length - 1 && (err.status === 404 || err.status === 0);
        if (canRetry) {
          return tryPath(index + 1);
        }
        return throwError(() => err);
      })
    );
  };
  return tryPath(0);
}
