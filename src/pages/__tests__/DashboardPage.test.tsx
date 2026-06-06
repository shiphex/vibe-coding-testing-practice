import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DashboardPage } from '../DashboardPage';

interface DashboardAuthMock {
    user: {
        username: string;
        role: 'admin' | 'user';
    } | null;
    logout: ReturnType<typeof vi.fn>;
}

const mocks = vi.hoisted(() => {
    let authState = {
        user: { username: 'dean', role: 'admin' as const },
        logout: vi.fn(),
    };

    return {
        navigate: vi.fn(),
        getAuthState: () => authState,
        setAuthState: (nextState: typeof authState) => {
            authState = nextState;
        },
        getProducts: vi.fn(),
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

vi.mock('../../api/productApi', () => ({
    productApi: {
        getProducts: (...args: unknown[]) => mocks.getProducts(...args),
    },
}));

const createAuthMock = (overrides: Partial<DashboardAuthMock> = {}): DashboardAuthMock => ({
    user: { username: 'dean', role: 'admin' },
    logout: vi.fn(),
    ...overrides,
});

const renderDashboardPage = (overrides: Partial<DashboardAuthMock> = {}) => {
    const authState = createAuthMock(overrides);
    mocks.setAuthState(authState);

    const user = userEvent.setup();
    const view = render(
        <MemoryRouter>
            <DashboardPage />
        </MemoryRouter>
    );

    return {
        user,
        authState,
        ...view,
    };
};

const createDeferred = <T,>() => {
    let resolve!: (value: T | PromiseLike<T>) => void;
    let reject!: (reason?: unknown) => void;

    const promise = new Promise<T>((res, rej) => {
        resolve = res;
        reject = rej;
    });

    return { promise, resolve, reject };
};

describe('DashboardPage', () => {
    beforeEach(() => {
        mocks.navigate.mockReset();
        mocks.setAuthState(createAuthMock());
        mocks.getProducts.mockReset();
        mocks.getProducts.mockResolvedValue([]);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('前端元素', () => {
        it('仪表板初始渲染显示标题、欢迎信息与登出按钮', async () => {
            const deferred = createDeferred<
                Array<{ id: number; name: string; price: number; description: string }>
            >();
            mocks.getProducts.mockReturnValueOnce(deferred.promise);

            renderDashboardPage();

            expect(screen.getByText('儀表板')).toBeInTheDocument();
            expect(screen.getByText('Welcome, dean 👋')).toBeInTheDocument();
            expect(screen.getByText('管理員')).toBeInTheDocument();
            expect(screen.getByRole('button', { name: '登出' })).toBeInTheDocument();
            expect(screen.getByText('商品列表')).toBeInTheDocument();

            deferred.resolve([]);
            await waitFor(() => {
                expect(screen.queryByText('載入商品中...')).not.toBeInTheDocument();
            });
        });

        it('admin 角色显示前往管理后台链接', async () => {
            renderDashboardPage({
                user: { username: 'dean', role: 'admin' },
            });

            const link = await screen.findByRole('link', { name: /管理後台/ });
            expect(link).toHaveAttribute('href', '/admin');
        });

        it('一般用户不显示前往管理后台链接', async () => {
            renderDashboardPage({
                user: { username: 'dean', role: 'user' },
            });

            await waitFor(() => {
                expect(mocks.getProducts).toHaveBeenCalledTimes(1);
            });
            expect(screen.queryByRole('link', { name: /管理後台/ })).not.toBeInTheDocument();
        });
    });

    describe('function 逻辑', () => {
        it('根据用户名首字母显示头像内容', async () => {
            renderDashboardPage({
                user: { username: 'dean', role: 'user' },
            });

            await waitFor(() => {
                expect(mocks.getProducts).toHaveBeenCalledTimes(1);
            });
            expect(screen.getByText('D')).toBeInTheDocument();
        });

        it('根据用户角色显示对应角色徽章文案', async () => {
            const { rerender } = render(
                <MemoryRouter>
                    <DashboardPage />
                </MemoryRouter>
            );

            await waitFor(() => {
                expect(screen.getByText('管理員')).toBeInTheDocument();
            });

            mocks.setAuthState(
                createAuthMock({
                    user: { username: 'dean', role: 'user' },
                })
            );

            rerender(
                <MemoryRouter>
                    <DashboardPage />
                </MemoryRouter>
            );

            expect(screen.getByText('一般用戶')).toBeInTheDocument();
        });

        it('点击登出后调用 logout 并跳转到 /login', async () => {
            const { user, authState } = renderDashboardPage();

            await waitFor(() => {
                expect(mocks.getProducts).toHaveBeenCalledTimes(1);
            });
            await user.click(screen.getByRole('button', { name: '登出' }));

            expect(authState.logout).toHaveBeenCalledTimes(1);
            expect(mocks.navigate).toHaveBeenCalledWith('/login', { replace: true, state: null });
        });
    });

    describe('Mock API', () => {
        it('商品载入中时显示 loading 状态', async () => {
            const deferred = createDeferred<
                Array<{ id: number; name: string; price: number; description: string }>
            >();
            mocks.getProducts.mockReturnValueOnce(deferred.promise);

            const { container } = renderDashboardPage();

            expect(screen.getByText('載入商品中...')).toBeInTheDocument();
            expect(container.querySelector('.loading-spinner')).toBeInTheDocument();

            await act(async () => {
                deferred.resolve([]);
                await deferred.promise;
            });
        });

        it('商品读取成功后显示商品卡片列表', async () => {
            mocks.getProducts.mockResolvedValueOnce([
                { id: 1, name: '筆記型電腦', price: 25000, description: '輕薄高效能筆記型電腦' },
                { id: 2, name: '無線滑鼠', price: 890, description: '人體工學設計' },
            ]);

            renderDashboardPage();

            expect(await screen.findByText('筆記型電腦')).toBeInTheDocument();
            expect(screen.getByText('無線滑鼠')).toBeInTheDocument();
            expect(screen.getByText('輕薄高效能筆記型電腦')).toBeInTheDocument();
            expect(screen.getByText('人體工學設計')).toBeInTheDocument();
            expect(screen.getByText('NT$ 25,000')).toBeInTheDocument();
            expect(screen.getByText('NT$ 890')).toBeInTheDocument();
            expect(screen.getAllByText('📦')).toHaveLength(2);
        });

        it('商品读取失败且后端回传 message 时显示后端错误讯息', async () => {
            mocks.getProducts.mockRejectedValueOnce({
                response: {
                    status: 500,
                    data: {
                        message: '服务器错误，请稍后再试',
                    },
                },
            });

            renderDashboardPage();

            expect(await screen.findByText('服务器错误，请稍后再试')).toBeInTheDocument();
            expect(screen.queryByText('載入商品中...')).not.toBeInTheDocument();
        });

        it('商品读取失败且后端未回传 message 时显示预设错误讯息', async () => {
            mocks.getProducts.mockRejectedValueOnce(new Error('network error'));

            renderDashboardPage();

            expect(await screen.findByText('無法載入商品資料')).toBeInTheDocument();
            expect(screen.queryByText('載入商品中...')).not.toBeInTheDocument();
        });

        it('商品读取失败且状态为 401 时不显示一般错误讯息并结束 loading', async () => {
            mocks.getProducts.mockRejectedValueOnce({
                response: {
                    status: 401,
                },
            });

            renderDashboardPage();

            await waitFor(() => {
                expect(screen.queryByText('載入商品中...')).not.toBeInTheDocument();
            });
            expect(screen.queryByText('無法載入商品資料')).not.toBeInTheDocument();
            expect(screen.queryByText('服务器错误，请稍后再试')).not.toBeInTheDocument();
            expect(document.querySelector('.error-container')).not.toBeInTheDocument();
        });
    });

    describe('验证权限', () => {
        it('页面在 admin 身份下提供进入 /admin 的导航入口', async () => {
            renderDashboardPage({
                user: { username: 'dean', role: 'admin' },
            });

            const link = await screen.findByRole('link', { name: /管理後台/ });
            expect(link).toHaveAttribute('href', '/admin');
        });
    });
});
