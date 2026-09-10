import { request, apiCall } from './client';
import { mockSupplyOrders } from './mockData';
import type { SupplyOrder } from '@/types';

/**
 * 供销仓储交割接口 (Swagger: /api/tcmirp/supply/*)
 */
export const supplyApi = {
  // 获取供销订单列表 GET /api/tcmirp/supply/orders
  async getSupplyOrders(params?: {
    keyword?: string;
    stage?: string;
    warehouse?: string;
    stockStatus?: string;
  }): Promise<SupplyOrder[]> {
    return apiCall(
      request.get('/supply/orders', { params }),
      mockSupplyOrders.filter(o => {
        if (params?.stage && params.stage !== 'ALL' && o.stage !== params.stage) return false;
        if (params?.stockStatus && o.stockStatus !== params.stockStatus) return false;
        if (params?.warehouse && !(o.warehouse || '').includes(params.warehouse)) return false;
        if (params?.keyword) {
          const kw = params.keyword.toLowerCase();
          return (o.orderNo || '').toLowerCase().includes(kw) ||
            (o.pieceName || '').toLowerCase().includes(kw) ||
            (o.batchNo || '').toLowerCase().includes(kw);
        }
        return true;
      }),
      '获取供销订单列表'
    );
  },

  // 获取订单详情 GET /api/tcmirp/supply/orders/{id}
  async getSupplyOrderDetail(id: string): Promise<SupplyOrder | null> {
    return apiCall(
      request.get(`/supply/orders/${id}`),
      mockSupplyOrders.find(o => o.id === id || o.orderNo === id) || mockSupplyOrders[0],
      '获取供销订单详情'
    );
  },

  // 记录仓储入库确认 POST /api/tcmirp/supply/orders/{id}/inbound
  async confirmInbound(id: string, payload: {
    warehouseCode: string;
    inboundNo: string;
    storageTemperature?: number;
  }): Promise<{ success: boolean; id: string }> {
    return apiCall(
      request.post(`/supply/orders/${id}/inbound`, payload),
      { success: true, id },
      '确认入仓交割'
    );
  },

  // 仓单质押申请 POST /api/tcmirp/supply/orders/{id}/pledge
  async applyPledge(id: string, payload: {
    pledgeBank: string;
    pledgeAmount: number;
    remark?: string;
  }): Promise<{ success: boolean; id: string; pledgeAmount: number }> {
    return apiCall(
      request.post(`/supply/orders/${id}/pledge`, payload),
      { success: true, id, pledgeAmount: payload.pledgeAmount },
      '申请仓单质押'
    );
  },

  // 变更订单状态环节 PUT /api/tcmirp/supply/orders/{id}/stage
  async updateOrderStage(id: string, stage: string): Promise<{ success: boolean; id: string; stage: string }> {
    return apiCall(
      request.put(`/supply/orders/${id}/stage`, { stage }),
      { success: true, id, stage },
      '更新订单环节'
    );
  }
};
