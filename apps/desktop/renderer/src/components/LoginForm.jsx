import PropTypes from 'prop-types';

export default function LoginForm({
  email,
  password,
  onEmailChange,
  onPasswordChange,
  onSubmit
}) {
  return (
    <form onSubmit={onSubmit} className="bg-white p-6 rounded-xl shadow-md w-96 space-y-3">
      <h1 className="text-xl font-semibold">Sign in</h1>

      <input
        className="w-full border p-2 rounded"
        value={email}
        onChange={(e) => onEmailChange(e.target.value)}
        placeholder="Email"
      />

      <input
        className="w-full border p-2 rounded"
        type="password"
        value={password}
        onChange={(e) => onPasswordChange(e.target.value)}
        placeholder="Password"
      />

      <button className="w-full bg-black text-white py-2 rounded">Login</button>

      <p className="text-xs text-gray-500">Demo: admin@example.com / admin123</p>
    </form>
  );
}

LoginForm.propTypes = {
  email: PropTypes.string.isRequired,
  password: PropTypes.string.isRequired,
  onEmailChange: PropTypes.func.isRequired,
  onPasswordChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};
