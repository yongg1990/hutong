import { defineStore } from 'pinia';
import type { EventSchemaConfig } from '@/types';

export const useMetadataStore = defineStore('metadata', {
  state: () => ({
    schemas: [
      {
        eventType: 'WAREHOUSED',
        eventTypeName: '入仓完成事件',
        schemaVersion: '1.0.0',
        scenarioCode: 'SUPPLY',
        status: 'PUBLISHED',
        groups: [
          { code: 'IDENTIFIER', title: '仓储与业务标识', fields: ['warehouseCode', 'locationCode', 'inboundNo', 'inventoryUnitCode', 'batchNo', 'traceCode'] },
          { code: 'QUANTITY_QUALITY', title: '数量、编码与质量', fields: ['quantity', 'unitCode', 'medicalInsurancePieceCode', 'qualityConclusion', 'storageTemperature', 'tempSensorLocation'] }
        ],
        jsonSchema: {
          type: 'object',
          required: ['warehouseCode', 'inboundNo', 'inventoryUnitCode', 'batchNo', 'quantity', 'unitCode'],
          properties: {
            warehouseCode: { type: 'string', title: '仓库编码', description: 'WH-KM-001' },
            locationCode: { type: 'string', title: '仓位编码', description: 'A-03-08' },
            inboundNo: { type: 'string', title: '入仓单号', description: 'IN-20260808-0021' },
            inventoryUnitCode: { type: 'string', title: '库存单元', description: 'INV-SQ-260731-08' },
            batchNo: { type: 'string', title: '饮片批次号', description: 'SQ-260731-08' },
            traceCode: { type: 'string', title: '追溯码', description: '693000260731080001' },
            quantity: { type: 'number', title: '入仓数量(kg)', minimum: 0.001 },
            unitCode: { type: 'string', title: '计量单位', enum: ['kg', 'g', 't'] },
            medicalInsurancePieceCode: { type: 'string', title: '医保饮片编码', pattern: '^\\d{16}$' },
            qualityConclusion: { type: 'string', title: '质量结论', enum: ['QUALIFIED', 'UNQUALIFIED'] },
            storageTemperature: { type: 'number', title: '储存温度(℃)' },
            tempSensorLocation: { type: 'string', title: '温度采集位置' }
          }
        }
      },
      {
        eventType: 'PLANTED',
        eventTypeName: '种植建档事件',
        schemaVersion: '1.0.0',
        scenarioCode: 'FIELD',
        status: 'PUBLISHED',
        groups: [
          { code: 'FIELD_INFO', title: '基地与作物标识', fields: ['cropBatchNo', 'baseCode', 'plotCode', 'herbName', 'species'] },
          { code: 'PLANT_DETAIL', title: '种植明细与规模', fields: ['plantArea', 'areaUnit', 'plantDate', 'seedSource'] }
        ],
        jsonSchema: {
          type: 'object',
          required: ['cropBatchNo', 'baseCode', 'plotCode', 'herbName', 'plantDate'],
          properties: {
            cropBatchNo: { type: 'string', title: '作物批次号' },
            baseCode: { type: 'string', title: '基地编码' },
            plotCode: { type: 'string', title: '地块编码' },
            herbName: { type: 'string', title: '药材名称' },
            species: { type: 'string', title: '基原品种' },
            plantArea: { type: 'number', title: '种植面积' },
            areaUnit: { type: 'string', title: '面积单位', enum: ['亩', '公顷'] },
            plantDate: { type: 'string', format: 'date', title: '种植日期' },
            seedSource: { type: 'string', title: '种苗来源' }
          }
        }
      },
      {
        eventType: 'QUALITY_INSPECTED',
        eventTypeName: '质量检验事件',
        schemaVersion: '1.2.0',
        scenarioCode: 'PROCESS_QUALITY',
        status: 'PUBLISHED',
        groups: [
          { code: 'BASIC', title: '质检基本信息', fields: ['reportNo', 'batchNo', 'inspectType', 'inspectDate'] },
          { code: 'INDICATORS', title: '检验指标明细', fields: ['indicatorsGrid'] }
        ],
        jsonSchema: {
          type: 'object',
          required: ['reportNo', 'batchNo', 'inspectType'],
          properties: {
            reportNo: { type: 'string', title: '质检报告编号' },
            batchNo: { type: 'string', title: '被检批次号' },
            inspectType: { type: 'string', title: '检验类型', enum: ['ROUTINE', 'FULL_STANDARD', 'SAMPLING'] },
            inspectDate: { type: 'string', format: 'date', title: '检验日期' }
          }
        }
      },
      {
        eventType: 'PRESCRIPTION_RECEIVED',
        eventTypeName: '处方接收事件',
        schemaVersion: '1.1.0',
        scenarioCode: 'DECOCTION',
        status: 'PUBLISHED',
        groups: [
          { code: 'PRESCRIPTION', title: '处方标识与脱敏信息', fields: ['hospitalCode', 'prescriptionNoToken', 'patientToken', 'doctorName'] },
          { code: 'ITEMS', title: '处方饮片明细', fields: ['prescriptionItemsGrid'] }
        ],
        jsonSchema: {
          type: 'object',
          required: ['hospitalCode', 'prescriptionNoToken', 'patientToken'],
          properties: {
            hospitalCode: { type: 'string', title: '医院编码' },
            prescriptionNoToken: { type: 'string', title: '处方脱敏Token' },
            patientToken: { type: 'string', title: '患者加密Token' },
            doctorName: { type: 'string', title: '医师姓名' }
          }
        }
      }
    ] as EventSchemaConfig[],
    eTagMap: {} as Record<string, string>
  }),
  getters: {
    getSchemaByType: (state) => (eventType: string) => {
      return state.schemas.find((s) => s.eventType === eventType) || state.schemas[0];
    }
  }
});
