import './ToggleSwitch.css';

const ToggleSwitch = ({ checked, onChange, label }) => {
  return (
    <div className="toggle-switch-container">
      {label && <label className="toggle-label">{label}</label>}
      <button
        type="button"
        className={`toggle-switch ${checked ? 'on' : 'off'}`}
        onClick={() => onChange(!checked)}
        role="switch"
        aria-checked={checked}
      >
        <span className="toggle-slider"></span>
      </button>
    </div>
  );
};

export default ToggleSwitch;
