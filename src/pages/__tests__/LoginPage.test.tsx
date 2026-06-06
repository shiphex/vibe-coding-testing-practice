import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LoginPage } from '../LoginPage';

interface AuthMock {
    login: ReturnType<typeof vi.fn>;
    isAuthenticated: boolean;
    authExpiredMessage: string | null;
    clearAuthExpiredMessage: ReturnType<typeof vi.fn>;
}

const mocks = vi.hoisted(() => {
    let authState = {
        login: vi.fn(),
        isAuthenticated: false,
        authExpiredMessage: null as string | null,
        clearAuthExpiredMessage: vi.fn(),
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

const createAuthMock = (overrides: Partial<AuthMock> = {}): AuthMock => ({
    login: vi.fn(),
    isAuthenticated: false,
    authExpiredMessage: null,
    clearAuthExpiredMessage: vi.fn(),
    ...overrides,
});

const renderLoginPage = (overrides: Partial<AuthMock> = {}) => {
    const authState = createAuthMock(overrides);
    mocks.setAuthState(authState);

    const user = userEvent.setup();
    const view = render(<LoginPage />);

    return {
        user,
        authState,
        ...view,
    };
};

const fillAndSubmit = async (
    user: ReturnType<typeof userEvent.setup>,
    {
        email,
        password,
    }: {
        email: string;
        password: string;
    }
) => {
    const emailInput = screen.getByLabelText('電子郵件');
    const passwordInput = screen.getByLabelText('密碼');

    await user.clear(emailInput);
    await user.type(emailInput, email);
    await user.clear(passwordInput);
    await user.type(passwordInput, password);
    await user.click(screen.getByRole('button', { name: '登入' }));
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

describe('LoginPage', () => {
    beforeEach(() => {
        mocks.navigate.mockReset();
        mocks.setAuthState(createAuthMock());
        vi.stubEnv('VITE_API_URL', 'https://example.com/api');
    });

    afterEach(() => {
        vi.clearAllMocks();
        vi.unstubAllEnvs();
    });

    describe('前端元素', () => {
        it('登录页初始渲染显示标题、输入框与提交按钮', () => {
            renderLoginPage();

            expect(screen.getByText('歡迎回來')).toBeInTheDocument();
            expect(screen.getByText('請登入以繼續')).toBeInTheDocument();
            expect(screen.getByLabelText('電子郵件')).toHaveAttribute('placeholder', 'you@example.com');
            expect(screen.getByLabelText('密碼')).toHaveAttribute('placeholder', '至少 8 個字元，需包含英數');
            expect(screen.getByRole('button', { name: '登入' })).toBeInTheDocument();
        });

        it('存在 authExpiredMessage 时显示错误提示横幅', async () => {
            const message = '登录已过期，请重新登录';
            const { authState } = renderLoginPage({
                authExpiredMessage: message,
            });

            expect(await screen.findByRole('alert')).toHaveTextContent(message);
            await waitFor(() => {
                expect(authState.clearAuthExpiredMessage).toHaveBeenCalledTimes(1);
            });
        });

        it('未设置 VITE_API_URL 时显示 Mock 模式说明', () => {
            vi.stubEnv('VITE_API_URL', '');

            renderLoginPage();

            expect(screen.getByText('測試帳號：任意 email 格式 / 密碼需包含英數且8位以上')).toBeInTheDocument();
        });
    });

    describe('function 逻辑', () => {
        it('输入无效 Email 后提交显示 Email 格式错误并中止登录', async () => {
            const { user, authState } = renderLoginPage();

            await fillAndSubmit(user, {
                email: 'abc',
                password: 'abc12345',
            });

            expect(screen.getByText('請輸入有效的 Email 格式')).toBeInTheDocument();
            expect(authState.login).not.toHaveBeenCalled();
            expect(mocks.navigate).not.toHaveBeenCalled();
        });

        it('输入少于 8 个字符的密码后提交显示密码长度错误并中止登录', async () => {
            const { user, authState } = renderLoginPage();

            await fillAndSubmit(user, {
                email: 'user@example.com',
                password: 'abc123',
            });

            expect(screen.getByText('密碼必須至少 8 個字元')).toBeInTheDocument();
            expect(authState.login).not.toHaveBeenCalled();
            expect(mocks.navigate).not.toHaveBeenCalled();
        });

        it('输入未同时包含英文与数字的密码后提交显示密码格式错误并中止登录', async () => {
            const { user, authState } = renderLoginPage();

            await fillAndSubmit(user, {
                email: 'user@example.com',
                password: 'abcdefgh',
            });

            expect(screen.getByText('密碼必須包含英xxxxxxxxx文字母和數字')).toBeInTheDocument();
            expect(authState.login).not.toHaveBeenCalled();
            expect(mocks.navigate).not.toHaveBeenCalled();
        });

        it('修正输入内容后再次提交会清除栏位错误状态', async () => {
            const { user, authState } = renderLoginPage();
            const emailInput = screen.getByLabelText('電子郵件');

            await fillAndSubmit(user, {
                email: 'abc',
                password: 'abc12345',
            });

            expect(screen.getByText('請輸入有效的 Email 格式')).toBeInTheDocument();
            expect(emailInput).toHaveClass('error');

            authState.login.mockResolvedValueOnce(undefined);

            await fillAndSubmit(user, {
                email: 'user@example.com',
                password: 'abc12345',
            });

            await waitFor(() => {
                expect(screen.queryByText('請輸入有效的 Email 格式')).not.toBeInTheDocument();
            });
            expect(emailInput).not.toHaveClass('error');
            expect(authState.login).toHaveBeenCalledWith('user@example.com', 'abc12345');
        });

        it('提交有效账号密码后进入 loading 状态并禁用表单', async () => {
            const deferred = createDeferred<void>();
            const { user, authState, container } = renderLoginPage();

            authState.login.mockReturnValueOnce(deferred.promise);

            await fillAndSubmit(user, {
                email: 'user@example.com',
                password: 'abc12345',
            });

            expect(screen.getByLabelText('電子郵件')).toBeDisabled();
            expect(screen.getByLabelText('密碼')).toBeDisabled();
            expect(screen.getByRole('button', { name: '登入中...' })).toBeDisabled();
            expect(container.querySelector('.button-spinner')).toBeInTheDocument();

            deferred.resolve();
            await waitFor(() => {
                expect(screen.getByRole('button', { name: '登入' })).toBeEnabled();
            });
        });
    });

    describe('Mock API', () => {
        it('登录成功后调用 login 并跳转到 /dashboard', async () => {
            const { user, authState } = renderLoginPage();

            authState.login.mockResolvedValueOnce(undefined);

            await fillAndSubmit(user, {
                email: 'user@example.com',
                password: 'abc12345',
            });

            await waitFor(() => {
                expect(authState.login).toHaveBeenCalledWith('user@example.com', 'abc12345');
            });
            expect(authState.login).toHaveBeenCalledTimes(1);
            expect(mocks.navigate).toHaveBeenCalledWith('/dashboard', { replace: true });
        });

        it('登录失败且后端回传 message 时显示后端错误讯息', async () => {
            const { user, authState } = renderLoginPage();

            authState.login.mockRejectedValueOnce({
                response: {
                    data: {
                        message: '账号或密码错误',
                    },
                },
            });

            await fillAndSubmit(user, {
                email: 'user@example.com',
                password: 'abc12345',
            });

            expect(await screen.findByRole('alert')).toHaveTextContent('账号或密码错误');
            expect(screen.getByRole('button', { name: '登入' })).toBeEnabled();
            expect(screen.getByLabelText('電子郵件')).toBeEnabled();
            expect(screen.getByLabelText('密碼')).toBeEnabled();
        });

        it('登录失败且后端未回传 message 时显示预设错误讯息', async () => {
            const { user, authState } = renderLoginPage();

            authState.login.mockRejectedValueOnce(new Error('network error'));

            await fillAndSubmit(user, {
                email: 'user@example.com',
                password: 'abc12345',
            });

            expect(await screen.findByRole('alert')).toHaveTextContent('登入失敗，請稍後再試');
            expect(screen.getByRole('button', { name: '登入' })).toBeEnabled();
            expect(screen.getByLabelText('電子郵件')).toBeEnabled();
            expect(screen.getByLabelText('密碼')).toBeEnabled();
        });
    });

    describe('验证权限', () => {
        it('已登录使用者进入登录页时自动跳转到 /dashboard', async () => {
            renderLoginPage({
                isAuthenticated: true,
            });

            await waitFor(() => {
                expect(mocks.navigate).toHaveBeenCalledWith('/dashboard', { replace: true });
            });
        });
    });
});
