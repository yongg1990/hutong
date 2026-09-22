import { request } from './client';

export type DictionaryStatus = 'ACTIVE' | 'INACTIVE' | string;

export interface DictionaryType {
  dictionaryTypeId: string;
  tenantId?: string;
  dictionaryCode: string;
  dictionaryName: string;
  description?: string;
  status: DictionaryStatus;
  lockVersion: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface DictionaryItem {
  dictionaryItemId: string;
  tenantId?: string;
  dictionaryCode: string;
  itemCode: string;
  itemName: string;
  parentItemId?: string;
  sortOrder?: number;
  status: DictionaryStatus;
  lockVersion: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface PageResult<T> {
  records: T[];
  total: string;
  page: string;
  size: string;
}

export interface DictionaryTypeCreateRequest {
  dictionaryCode: string;
  dictionaryName: string;
  description?: string;
}

export interface DictionaryTypeUpdateRequest {
  dictionaryName: string;
  description?: string;
  status?: DictionaryStatus;
  lockVersion: number;
}

export interface DictionaryItemCreateRequest {
  itemCode: string;
  itemName: string;
  parentItemId?: string;
  sortOrder?: number;
}

export interface DictionaryItemUpdateRequest {
  itemName: string;
  parentItemId?: string;
  sortOrder?: number;
  status?: DictionaryStatus;
  lockVersion: number;
}

export const dictionaryApi = {
  listTypes(params: { keyword?: string; status?: string; page: string; size: string }) {
    return request.get<PageResult<DictionaryType>, PageResult<DictionaryType>>('/tenant-access/dictionaries', { params });
  },
  createType(data: DictionaryTypeCreateRequest) {
    return request.post<DictionaryType, DictionaryType>('/tenant-access/dictionaries', data);
  },
  updateType(typeId: string, data: DictionaryTypeUpdateRequest) {
    return request.post<DictionaryType, DictionaryType>('/tenant-access/dictionaries/' + encodeURIComponent(typeId), data);
  },
  listItems(dictionaryCode: string, params: { keyword?: string; parentItemId?: string; status?: string; page: string; size: string }) {
    return request.get<PageResult<DictionaryItem>, PageResult<DictionaryItem>>('/tenant-access/dictionaries/' + encodeURIComponent(dictionaryCode) + '/items', { params });
  },
  listActiveItems(dictionaryCode: string) {
    return request.get<DictionaryItem[], DictionaryItem[]>('/tenant-access/dictionaries/' + encodeURIComponent(dictionaryCode) + '/items/active');
  },
  createItem(dictionaryCode: string, data: DictionaryItemCreateRequest) {
    return request.post<DictionaryItem, DictionaryItem>('/tenant-access/dictionaries/' + encodeURIComponent(dictionaryCode) + '/items', data);
  },
  updateItem(dictionaryCode: string, itemId: string, data: DictionaryItemUpdateRequest) {
    return request.post<DictionaryItem, DictionaryItem>('/tenant-access/dictionaries/' + encodeURIComponent(dictionaryCode) + '/items/' + encodeURIComponent(itemId), data);
  }
};
