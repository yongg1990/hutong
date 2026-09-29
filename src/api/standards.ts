import { request } from './client';

export interface DataElement {
  id: string;
  elementCode: string;
  elementName: string;
  dataType: string;
  valueSetCode?: string;
  securityClass: string;
  sourceReference?: string;
  status: string;
  lockVersion: number;
}

export interface ValueSet {
  valueSetId: string;
  valueSetCode: string;
  valueSetName: string;
  version: string;
  status: string;
  itemCount?: string;
}

export interface ValueSetItem {
  itemId: string;
  valueSetId: string;
  itemCode: string;
  itemName: string;
  validFrom: string;
  validTo?: string;
  status: string;
}

interface Page<T> { records: T[]; total: string; page: string; size: string }

export const standardsApi = {
  dataElements: (params: Record<string, string | number>) => request.get<Page<DataElement>, Page<DataElement>>('/openapi/v1/data-elements', { params }),
  createDataElement: (data: { elementCode: string; elementName: string; dataType: string; securityClass: string; valueSetCode?: string }) => request.post<DataElement, DataElement>('/openapi/v1/data-elements', data),
  updateDataElement: (id: string, data: Partial<DataElement>) => request.post<DataElement, DataElement>(`/openapi/v1/data-elements/${encodeURIComponent(id)}`, data),
  setDataElementStatus: (id: string, status: string) => request.post<DataElement, DataElement>(`/openapi/v1/data-elements/${encodeURIComponent(id)}/status`, { status }),
  valueSets: (params: Record<string, string | number>) => request.get<Page<ValueSet>, Page<ValueSet>>('/openapi/v1/value-sets', { params }),
  createValueSet: (data: { valueSetCode: string; valueSetName: string; version: string }) => request.post<ValueSet, ValueSet>('/openapi/v1/value-sets', data),
  updateValueSet: (id: string, valueSetName: string) => request.post<ValueSet, ValueSet>(`/openapi/v1/value-sets/${encodeURIComponent(id)}`, { valueSetName }),
  setValueSetStatus: (id: string, status: string) => request.post<ValueSet, ValueSet>(`/openapi/v1/value-sets/${encodeURIComponent(id)}/status`, { status }),
  items: (id: string, params: Record<string, string | number>) => request.get<Page<ValueSetItem>, Page<ValueSetItem>>(`/openapi/v1/value-sets/${encodeURIComponent(id)}/items`, { params }),
  createItem: (id: string, data: { itemCode: string; itemName: string; validFrom: string }) => request.post<ValueSetItem, ValueSetItem>(`/openapi/v1/value-sets/${encodeURIComponent(id)}/items`, data),
  updateItem: (valueSetId: string, itemId: string, data: { itemName: string; validFrom: string; validTo?: string }) => request.post<ValueSetItem, ValueSetItem>(`/openapi/v1/value-sets/${encodeURIComponent(valueSetId)}/items/${encodeURIComponent(itemId)}`, data),
  setItemStatus: (valueSetId: string, itemId: string, status: string) => request.post<ValueSetItem, ValueSetItem>(`/openapi/v1/value-sets/${encodeURIComponent(valueSetId)}/items/${encodeURIComponent(itemId)}/status`, { status })
};
