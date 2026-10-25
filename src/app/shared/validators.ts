import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function strongPassword(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const v = (control.value as string | null) ?? '';
    if (!v) {
      return null;
    }
    const ok = v.length >= 8 && /[a-z]/.test(v) && /[A-Z]/.test(v) && /\d/.test(v) && /[^A-Za-z0-9]/.test(v);
    return ok ? null : { weakPassword: true };
  };
}

export function phoneNumber(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const v = (control.value as string | null) ?? '';
    if (!v) {
      return null;
    }
    return /^\+?\d{7,15}$/.test(v.replace(/[\s-]/g, '')) ? null : { invalidPhone: true };
  };
}

export function maxTwoDecimals(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const v = control.value as number | string | null;
    if (v === null || v === '') {
      return null;
    }
    return /^\d+(\.\d{1,2})?$/.test(String(v)) ? null : { decimals: true };
  };
}

/** Amount may not exceed the balance returned by getBalance(). */
export function withinBalance(getBalance: () => number | null): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const v = Number(control.value);
    const balance = getBalance();
    if (!control.value || balance === null || isNaN(v)) {
      return null;
    }
    return v > balance ? { insufficient: true } : null;
  };
}

export function matchPasswords(a: string, b: string): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const pa = group.get(a)?.value as string | undefined;
    const pb = group.get(b)?.value as string | undefined;
    return pa && pb && pa !== pb ? { mismatch: true } : null;
  };
}
