import { Directive, ElementRef, HostListener, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Directive({
  selector: '[appPriceFormat]',
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PriceFormatDirective),
      multi: true
    }
  ]
})
export class PriceFormatDirective implements ControlValueAccessor {
  private onChange: (value: number | null) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(private el: ElementRef<HTMLInputElement>) {}

  @HostListener('input', ['$event.target.value'])
  onInput(value: string): void {
    // 1. Remove all non-digits
    const cleanValue = value.replace(/\D/g, '');
    
    if (!cleanValue) {
      this.el.nativeElement.value = '';
      this.onChange(null);
      return;
    }

    // 2. Format with dots
    const formatted = this.formatNumber(cleanValue);
    
    // 3. Keep cursor position
    const input = this.el.nativeElement;
    const start = input.selectionStart ?? 0;
    const oldLength = input.value.length;
    
    input.value = formatted;
    
    const newLength = formatted.length;
    const newStart = start + (newLength - oldLength);
    input.setSelectionRange(newStart, newStart);

    // 4. Propagate number to model
    this.onChange(Number(cleanValue));
  }

  @HostListener('blur')
  onBlur(): void {
    this.onTouched();
  }

  writeValue(value: number | null): void {
    if (value == null || isNaN(value)) {
      this.el.nativeElement.value = '';
      return;
    }
    this.el.nativeElement.value = this.formatNumber(String(value));
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  private formatNumber(val: string): string {
    return val.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }
}
