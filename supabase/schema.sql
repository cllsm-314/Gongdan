-- ============================================
-- 门店运营工单系统 - Supabase 数据库初始化脚本
-- ============================================

-- 启用 UUID 生成扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 表结构定义
-- ============================================

-- 门店表
CREATE TABLE IF NOT EXISTS stores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    feishu_department_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    feishu_user_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    avatar_url TEXT,
    store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
    role TEXT NOT NULL DEFAULT 'store' CHECK (role IN ('admin', 'store')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 工单表
CREATE TABLE IF NOT EXISTS tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT NOT NULL CHECK (type IN ('switch_room', 'price_adjustment', 'enterprise_card', 'whitelist')),
    store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'closed')),
    form_data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 工单消息表
CREATE TABLE IF NOT EXISTS ticket_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
    content TEXT NOT NULL DEFAULT '',
    attachment_type TEXT CHECK (attachment_type IN ('text', 'image', 'file')),
    attachment_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 管理员配置表
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    feishu_user_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 索引
-- ============================================

CREATE INDEX IF NOT EXISTS idx_tickets_store_id ON tickets(store_id);
CREATE INDEX IF NOT EXISTS idx_tickets_created_by ON tickets(created_by);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_type ON tickets(type);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket_id ON ticket_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_created_at ON ticket_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_users_feishu_user_id ON users(feishu_user_id);
CREATE INDEX IF NOT EXISTS idx_users_store_id ON users(store_id);

-- ============================================
-- 行级安全策略 (RLS)
-- ============================================

-- 启用 RLS
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- stores 表策略
CREATE POLICY "Public can view stores" ON stores
    FOR SELECT USING (true);

CREATE POLICY "Admin can insert stores" ON stores
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admin can update stores" ON stores
    FOR UPDATE USING (true);

-- users 表策略
CREATE POLICY "Public can view users" ON users
    FOR SELECT USING (true);

CREATE POLICY "Users can update own record" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Service role can manage users" ON users
    FOR ALL USING (true);

-- tickets 表策略
CREATE POLICY "Users can view own tickets" ON tickets
    FOR SELECT USING (
        created_by = auth.uid() OR 
        EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
    );

CREATE POLICY "Authenticated users can create tickets" ON tickets
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own tickets" ON tickets
    FOR UPDATE USING (
        created_by = auth.uid() OR 
        EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
    );

CREATE POLICY "Admin can delete tickets" ON tickets
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
    );

-- ticket_messages 表策略
CREATE POLICY "Users can view messages of accessible tickets" ON ticket_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM tickets 
            WHERE tickets.id = ticket_id 
            AND (tickets.created_by = auth.uid() OR EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'))
        )
    );

CREATE POLICY "Authenticated users can create messages" ON ticket_messages
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- admin_users 表策略
CREATE POLICY "Admin can view admin_users" ON admin_users
    FOR SELECT USING (true);

CREATE POLICY "Admin can manage admin_users" ON admin_users
    FOR ALL USING (
        EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
    );

-- ============================================
-- 触发器
-- ============================================

-- 更新时间戳触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tickets_updated_at
    BEFORE UPDATE ON tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 初始数据
-- ============================================

-- 插入示例门店数据
INSERT INTO stores (name, feishu_department_id) VALUES
    ('门店001 - 杭州西湖店', 'dept_001'),
    ('门店002 - 上海外滩店', 'dept_002'),
    ('门店003 - 北京王府井店', 'dept_003'),
    ('门店004 - 深圳华强北店', 'dept_004'),
    ('门店005 - 广州珠江新城店', 'dept_005')
ON CONFLICT DO NOTHING;

-- 插入预设管理员
INSERT INTO admin_users (feishu_user_id, name) VALUES
    ('admin_zhangchunlei', '张春雷'),
    ('admin_general_manager', '门店总经理')
ON CONFLICT DO NOTHING;

-- ============================================
-- Realtime 配置
-- ============================================

-- 启用 Realtime for ticket_messages 表
ALTER PUBLICATION supabase_realtime ADD TABLE ticket_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE tickets;

-- ============================================
-- Storage Bucket 配置
-- ============================================

-- 创建附件存储桶 (需要手动在 Supabase Dashboard 配置或使用以下代码)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('ticket-attachments', 'ticket-attachments', true);

-- ============================================
-- 存储策略
-- ============================================

-- 注意：storage buckets 需要在 Supabase Storage 中手动创建
-- 创建后执行以下策略：

-- CREATE POLICY "Anyone can upload attachments" ON storage.objects
--     FOR INSERT WITH CHECK (bucket_id = 'ticket-attachments');

-- CREATE POLICY "Anyone can view attachments" ON storage.objects
--     FOR SELECT USING (bucket_id = 'ticket-attachments');

-- CREATE POLICY "Users can delete own attachments" ON storage.objects
--     FOR DELETE USING (bucket_id = 'ticket-attachments');
