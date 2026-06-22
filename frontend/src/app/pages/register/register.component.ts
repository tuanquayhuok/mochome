import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  template: ''
})
export class RegisterComponent implements OnInit {
  private readonly router = inject(Router);

  ngOnInit(): void {
    this.router.navigate(['/tai-khoan'], { queryParams: { tab: 'register' } });
  }
}
