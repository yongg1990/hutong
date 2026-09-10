import { request, apiCall } from './client';
import { mockDecoctionOrders } from './mockData';
import type { DecoctionOrder } from '@/types';

/**
 * 处方代煎与配送协同接口 (Swagger: /api/tcmirp/decoction/*)
 */
export const decoctionApi = {
  // 获取代煎任务队列 GET /api/tcmirp/decoction/orders
  async getDecoctionOrders(params?: { stage?: string; hospitalCode?: string }): Promise<DecoctionOrder[]> {
    return apiCall(
      request.get('/decoction/orders', { params }),
      mockDecoctionOrders.filter(o => {
        if (params?.stage && o.stage !== params.stage) return false;
        return true;
      }),
      '获取代煎订单列表'
    );
  },

  // 获取代煎详情 GET /api/tcmirp/decoction/orders/{id}
  async getDecoctionOrderDetail(id: string): Promise<DecoctionOrder | null> {
    return apiCall(
      request.get(`/decoction/orders/${id}`),
      mockDecoctionOrders.find(o => o.id === id) || mockDecoctionOrders[0],
      '获取代煎订单详情'
    );
  },

  // 推进处方代煎环节状态 PUT /api/tcmirp/decoction/orders/{id}/stage
  async updateStage(id: string, stage: 'RECEIVED' | 'DECOCTING' | 'PACKAGING' | 'DELIVERING' | 'COMPLETED'): Promise<{ success: boolean; id: string; stage: string }> {
    return apiCall(
      request.put(`/decoction/orders/${id}/stage`, { stage }),
      { success: true, id, stage },
      '更新代煎环节状态'
    );
  },

  // 接收/登记新处方 POST /api/tcmirp/decoction/prescriptions
  async receivePrescription(payload: Partial<DecoctionOrder>): Promise<DecoctionOrder> {
    const newOrder: DecoctionOrder = {
      id: `DEC-${Date.now().toString().slice(-4)}`,
      prescriptionNoToken: payload.prescriptionNoToken || `PRE-${Math.floor(Math.random() * 9000 + 1000)}****101`,
      hospitalName: payload.hospitalName || '云南省中医医院',
      centerName: payload.centerName || '昆明智慧代煎中心',
      stage: 'RECEIVED',
      itemCount: payload.itemCount || 10,
      deliverStatus: 'PENDING',
      createdAt: new Date().toLocaleString()
    };
    return apiCall(
      request.post('/decoction/prescriptions', payload),
      newOrder,
      '接收医疗机构处方'
    );
  }
};
