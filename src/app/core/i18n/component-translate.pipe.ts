import { Pipe, PipeTransform, inject } from '@angular/core';
import { ComponentI18nService } from './component-i18n.service';

@Pipe({ name: 'componentT', standalone: true, pure: false })
export class ComponentTranslatePipe implements PipeTransform {
  private readonly i18n = inject(ComponentI18nService);

  transform(key: string, scope: string, fallback = key): string {
    return this.i18n.t(scope, key, fallback);
  }
}
