import { AdminCrumb } from './admin-catalog-page.component';

export const PRODUCT_SECTION_CRUMBS: AdminCrumb[] = [
  { label: 'Dashboard', route: '/admin/dashboard' },
  { label: 'Quản lý sản phẩm' }
];

export function productSectionCrumbs(page: string): AdminCrumb[] {
  return [...PRODUCT_SECTION_CRUMBS, { label: page }];
}
