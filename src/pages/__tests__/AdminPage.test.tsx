import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RoleBasedRoute } from '../../components/RoleBasedRoute';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { AdminPage } from '../AdminPage';

interface AdminAuthMock {
    user: {
        username: string;
        role: 'admin' | 'user';
    } | null;
    logout: ReturnType<typeof vi.fn>;
    isAuthenticated: boolean;
    isLoading: boolean;
}

const mocks = vi.hoisted(() => {
    let authState = {
        user: { username: 'dean', role: 'admin' as const },
        logout: vi.fn(),
        isAuthenticated: true,
        isLoading: false,
    };

    return {
        navigate: vi.fn(),
        getAuthState: () => authState,
        setAuthState: (nextState: typeof authState) => {
            authState = nextState;
        },
    };
});

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');

    return {
        ...actual,
        useNavigate: () => mocks.navigate,
    };
});

vi.mock('../../context/AuthContext', () => ({
    useAuth: () => mocks.getAuthState(),
}));

const createAuthMock = (overrides: Partial<AdminAuthMock> = {}): AdminAuthMock => ({
    user: { username: 'dean', role: 'admin' },
    logout: vi.fn(),
    isAuthenticated: true,
    isLoading: false,
    ...overrides,
});

const renderAdminPage = (overrides: Partial<AdminAuthMock> = {}) => {
    const authState = createAuthMock(overrides);
    mocks.setAuthState(authState);

    const user = userEvent.setup();
    const view = render(
        <MemoryRouter>
            <AdminPage />
        </MemoryRouter>
    );

    return {
        user,
        authState,
        ...view,
    };
};

const renderAdminRoute = (
    overrides: Partial<AdminAuthMock> = {},
    initialPath = '/admin'
) => {
    mocks.setAuthState(createAuthMock(overrides));

    return render(
        <MemoryRouter initialEntries={[initialPath]}>
            <Routes>
                <Route
                    path="/admin"
                    element={
                        <ProtectedRoute>
                            <RoleBasedRoute allowedRoles={['admin']}>
                                <AdminPage />
                            </RoleBasedRoute>
                        </ProtectedRoute>
                    }
                />
                <Route path="/dashboard" element={<div>Dashboard Route</div>} />
                <Route path="/login" element={<div>Login Route</div>} />
            </Routes>
        </MemoryRouter>
    );
};

describe('AdminPage', () => {
    beforeEach(() => {
        mocks.navigate.mockReset();
        mocks.setAuthState(createAuthMock());
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('前端元素', () => {
        it('管理后台初始渲染显示返回链接、标题、角色徽章与登出按钮', () => {
            renderAdminPage();

            expect(screen.getByRole('link', { name: '← 返回' })).toHaveAttribute('href', '/dashboard');
            expect(screen.getByRole('heading', { name: '🛠️ 管理後台' })).toBeInTheDocument();
            expect(screen.getByText('管理員')).toBeInTheDocument();
            expect(screen.getByRole('button', { name: '登出' })).toBeInTheDocument();
        });

        it('页面显示管理员专属说明与三项权限提示', () => {
            renderAdminPage();

            expect(screen.getByRole('heading', { name: '管理員專屬頁面' })).toBeInTheDocument();
            expect(screen.getByText('只有 admin 角色可以訪問')).toBeInTheDocument();
            expect(screen.getByText('user 角色會被重定向')).toBeInTheDocument();
            expect(screen.getByText('受路由守衛保護')).toBeInTheDocument();
        });
    });

    describe('function 逻辑', () => {
        it('点击返回链接可返回 /dashboard', () => {
            renderAdminPage();

            expect(screen.getByRole('link', { name: '← 返回' })).toHaveAttribute('href', '/dashboard');
        });

        it('点击登出后调用 logout 并跳转到 /login', async () => {
            const { user, authState } = renderAdminPage();

            await user.click(screen.getByRole('button', { name: '登出' }));

            expect(authState.logout).toHaveBeenCalledTimes(1);
            expect(mocks.navigate).toHaveBeenCalledWith('/login', { replace: true, state: null });
        });

        it('根据用户角色显示对应角色徽章文案', () => {
            const { rerender } = render(
                <MemoryRouter>
                    <AdminPage />
                </MemoryRouter>
            );

            expect(screen.getByText('管理員')).toBeInTheDocument();

            mocks.setAuthState(
                createAuthMock({
                    user: { username: 'dean', role: 'user' },
                })
            );

            rerender(
                <MemoryRouter>
                    <AdminPage />
                </MemoryRouter>
            );

            expect(screen.getByText('一般用戶')).toBeInTheDocument();
        });
    });

    describe('验证权限', () => {
        it('admin 角色进入 /admin 时可看到管理后台页面', () => {
            renderAdminRoute({
                user: { username: 'dean', role: 'admin' },
                isAuthenticated: true,
                isLoading: false,
            });

            expect(screen.getByRole('heading', { name: '🛠️ 管理後台' })).toBeInTheDocument();
        });

        it('一般用户进入 /admin 时会被重定向到 /dashboard', () => {
            renderAdminRoute({
                user: { username: 'dean', role: 'user' },
                isAuthenticated: true,
                isLoading: false,
            });

            expect(screen.getByText('Dashboard Route')).toBeInTheDocument();
        });

        it('未登录用户进入 /admin 时会被重定向到 /login', () => {
            renderAdminRoute({
                user: null,
                isAuthenticated: false,
                isLoading: false,
            });

            expect(screen.getByText('Login Route')).toBeInTheDocument();
        });

        it('权限验证进行中时显示路由守卫的 loading 状态', () => {
            renderAdminRoute({
                user: null,
                isAuthenticated: false,
                isLoading: true,
            });

            expect(screen.getByText('驗證中...')).toBeInTheDocument();
            expect(document.querySelector('.loading-spinner')).toBeInTheDocument();
        });
    });
});
