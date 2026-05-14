// 用户角色
export type UserRole = 'admin' | 'store';

// 工单类型
export type TicketType = 'switch_room' | 'price_adjustment' | 'enterprise_card' | 'whitelist';

// 工单状态
export type TicketStatus = 'pending' | 'processing' | 'completed' | 'closed';

// 附件类型
export type AttachmentType = 'text' | 'image' | 'file';

// 门店
export interface Store {
  id: string;
  name: string;
  feishu_department_id?: string;
  created_at: string;
}

// 用户
export interface User {
  id: string;
  feishu_user_id: string;
  name: string;
  avatar_url?: string;
  store_id?: string;
  role: UserRole;
  created_at: string;
}

// 工单表单数据
export interface SwitchRoomFormData {
  description: string;
  reason: string;
  attachments?: string[];
}

export interface PriceAdjustmentFormData {
  description: string;
  reason: string;
  currentPrice?: string;
  newPrice?: string;
  attachments?: string[];
}

export interface EnterpriseCardFormData {
  taxId: string;
  enterpriseName: string;
  contactName: string;
  contactPhone: string;
  salesName: string;
  salesPhone: string;
  description?: string;
  attachments?: string[];
}

export interface WhitelistFormData {
  enterpriseName: string;
  description?: string;
  attachments?: string[];
}

export type FormData = 
  | SwitchRoomFormData 
  | PriceAdjustmentFormData 
  | EnterpriseCardFormData 
  | WhitelistFormData;

// 工单
export interface Ticket {
  id: string;
  type: TicketType;
  store_id?: string;
  created_by?: string;
  title: string;
  status: TicketStatus;
  form_data: FormData;
  created_at: string;
  updated_at: string;
  // 关联数据
  store?: Store;
  creator?: User;
}

// 工单消息
export interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_id?: string;
  content: string;
  attachment_type?: AttachmentType;
  attachment_url?: string;
  created_at: string;
  // 关联数据
  sender?: User;
}

// 会话数据
export interface SessionData {
  userId: string;
  feishuUserId: string;
  name: string;
  avatarUrl?: string;
  role: UserRole;
  storeId?: string;
  oauthState?: string; // OAuth CSRF 防护
}

// 工单类型配置
export interface TicketTypeConfig {
  type: TicketType;
  title: string;
  description: string;
  icon: string;
  color: string;
}

// 工单类型映射
export const TICKET_TYPES: Record<TicketType, TicketTypeConfig> = {
  switch_room: {
    type: 'switch_room',
    title: '开关房申请',
    description: '请阐述原因及需求',
    icon: 'door-open',
    color: 'bg-blue-500',
  },
  price_adjustment: {
    type: 'price_adjustment',
    title: '调价申请',
    description: '请阐述原因及需求',
    icon: 'badge-yen',
    color: 'bg-green-500',
  },
  enterprise_card: {
    type: 'enterprise_card',
    title: '企业卡创建',
    description: '仅限9和1开头税号之外',
    icon: 'credit-card',
    color: 'bg-purple-500',
  },
  whitelist: {
    type: 'whitelist',
    title: '企业白名单录入',
    description: '请使用通用模版，告知企业全称',
    icon: 'list-checks',
    color: 'bg-orange-500',
  },
};

// 工单状态映射
export const TICKET_STATUS: Record<TicketStatus, { label: string; color: string }> = {
  pending: { label: '待处理', color: 'bg-yellow-100 text-yellow-800' },
  processing: { label: '处理中', color: 'bg-blue-100 text-blue-800' },
  completed: { label: '已完成', color: 'bg-green-100 text-green-800' },
  closed: { label: '已关闭', color: 'bg-gray-100 text-gray-800' },
};
