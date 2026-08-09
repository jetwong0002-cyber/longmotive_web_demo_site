/* @ds-bundle: {"format":4,"namespace":"LongmotiveDesignSystem_8d1e5c","components":[{"name":"Button","sourcePath":"components/actions/Button.jsx"},{"name":"IconButton","sourcePath":"components/actions/IconButton.jsx"},{"name":"Logo","sourcePath":"components/brand/Logo.jsx"},{"name":"Badge","sourcePath":"components/content/Badge.jsx"},{"name":"Card","sourcePath":"components/content/Card.jsx"},{"name":"SectionHeading","sourcePath":"components/content/SectionHeading.jsx"},{"name":"StatCard","sourcePath":"components/content/StatCard.jsx"},{"name":"Tag","sourcePath":"components/content/Tag.jsx"},{"name":"Alert","sourcePath":"components/feedback/Alert.jsx"},{"name":"Checkbox","sourcePath":"components/forms/Checkbox.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"Select","sourcePath":"components/forms/Select.jsx"},{"name":"Textarea","sourcePath":"components/forms/Textarea.jsx"}],"sourceHashes":{"components/actions/Button.jsx":"fdd93a30ea61","components/actions/IconButton.jsx":"83c344b09fd0","components/brand/Logo.jsx":"3d8892973ce1","components/content/Badge.jsx":"40a62a9591d1","components/content/Card.jsx":"553bc78a5345","components/content/SectionHeading.jsx":"21cb39acc8f1","components/content/StatCard.jsx":"3ad35029bbd7","components/content/Tag.jsx":"f5095f1dee20","components/feedback/Alert.jsx":"ab75849b3fe3","components/forms/Checkbox.jsx":"e96f0bea53df","components/forms/Input.jsx":"bc59717de85a","components/forms/Select.jsx":"20c4f2f24d09","components/forms/Textarea.jsx":"f23f65663500","ui_kits/website/AboutScreen.jsx":"385a2f7f5658","ui_kits/website/App.jsx":"490c63c69785","ui_kits/website/ContactScreen.jsx":"66faa8905dfd","ui_kits/website/HomeScreen.jsx":"d8add56235c7","ui_kits/website/Icons.jsx":"726ea5b1ad38","ui_kits/website/ProjectsScreen.jsx":"c7066531a995","ui_kits/website/ServicesScreen.jsx":"6837c7c6e704","ui_kits/website/SiteChrome.jsx":"698372e33cb8","ui_kits/website/data.js":"681d329a008f"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.LongmotiveDesignSystem_8d1e5c = window.LongmotiveDesignSystem_8d1e5c || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/actions/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const base = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  fontFamily: 'var(--font-display)',
  fontWeight: 'var(--fw-bold)',
  letterSpacing: 'var(--ls-wide)',
  textTransform: 'uppercase',
  border: 'var(--border-width-strong) solid transparent',
  borderRadius: 'var(--radius-sm)',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  transition: 'background var(--dur-fast) var(--ease-standard),color var(--dur-fast) var(--ease-standard),border-color var(--dur-fast) var(--ease-standard),transform var(--dur-fast) var(--ease-standard),box-shadow var(--dur-fast) var(--ease-standard)',
  textDecoration: 'none',
  lineHeight: 1
};
const sizes = {
  sm: {
    fontSize: '0.75rem',
    padding: '8px 14px'
  },
  md: {
    fontSize: '0.8125rem',
    padding: '12px 20px'
  },
  lg: {
    fontSize: '0.9375rem',
    padding: '16px 28px'
  }
};
const variants = {
  primary: {
    background: 'var(--color-brand)',
    color: 'var(--text-inverse)',
    borderColor: 'var(--color-brand)'
  },
  secondary: {
    background: 'transparent',
    color: 'var(--color-brand)',
    borderColor: 'var(--color-brand)'
  },
  accent: {
    background: 'var(--color-accent)',
    color: 'var(--lm-blue-900)',
    borderColor: 'var(--color-accent)'
  },
  ghost: {
    background: 'transparent',
    color: 'var(--text-body)',
    borderColor: 'transparent'
  },
  inverse: {
    background: 'var(--lm-white)',
    color: 'var(--color-brand)',
    borderColor: 'var(--lm-white)'
  }
};
function Button({
  children,
  variant = 'primary',
  size = 'md',
  iconLeft,
  iconRight,
  fullWidth = false,
  disabled = false,
  href,
  onClick,
  type = 'button',
  style,
  ...rest
}) {
  const Tag = href ? 'a' : 'button';
  const css = {
    ...base,
    ...sizes[size],
    ...variants[variant],
    ...(fullWidth ? {
      width: '100%'
    } : null),
    ...(disabled ? {
      opacity: .45,
      cursor: 'not-allowed',
      pointerEvents: 'none'
    } : null),
    ...style
  };
  return /*#__PURE__*/React.createElement(Tag, _extends({
    className: `lm-btn lm-btn--${variant}`,
    href: href,
    type: href ? undefined : type,
    onClick: onClick,
    style: css,
    "aria-disabled": disabled || undefined
  }, rest), iconLeft && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      width: '1.15em',
      height: '1.15em'
    }
  }, iconLeft), children, iconRight && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      width: '1.15em',
      height: '1.15em'
    }
  }, iconRight));
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/actions/Button.jsx", error: String((e && e.message) || e) }); }

// components/actions/IconButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const sizes = {
  sm: {
    width: '32px',
    height: '32px',
    fontSize: '16px',
    borderRadius: 'var(--radius-sm)'
  },
  md: {
    width: '40px',
    height: '40px',
    fontSize: '18px',
    borderRadius: 'var(--radius-sm)'
  },
  lg: {
    width: '48px',
    height: '48px',
    fontSize: '20px',
    borderRadius: 'var(--radius-md)'
  }
};
const variants = {
  solid: {
    background: 'var(--color-brand)',
    color: 'var(--text-inverse)'
  },
  soft: {
    background: 'var(--lm-blue-50)',
    color: 'var(--color-brand)'
  },
  ghost: {
    background: 'transparent',
    color: 'var(--text-body)'
  }
};
function IconButton({
  children,
  label,
  variant = 'ghost',
  size = 'md',
  disabled = false,
  onClick,
  href,
  style,
  ...rest
}) {
  const Tag = href ? 'a' : 'button';
  const css = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    cursor: 'pointer',
    lineHeight: 0,
    transition: 'background var(--dur-fast) var(--ease-standard),transform var(--dur-fast) var(--ease-standard)',
    ...sizes[size],
    ...variants[variant],
    ...(disabled ? {
      opacity: .4,
      cursor: 'not-allowed',
      pointerEvents: 'none'
    } : null),
    ...style
  };
  return /*#__PURE__*/React.createElement(Tag, _extends({
    className: `lm-iconbtn lm-iconbtn--${variant}`,
    href: href,
    onClick: onClick,
    "aria-label": label,
    title: label,
    style: css
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      width: '1em',
      height: '1em'
    }
  }, children));
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/actions/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/brand/Logo.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Logo renders the real Longmotive lockup when `src` points at the copied
   asset (assets/logo.png). With no src it falls back to a typographic wordmark
   — never a reconstructed version of the LM icon mark. */
function Logo({
  src,
  height = 40,
  alt = 'Longmotive',
  mono = false,
  style,
  ...rest
}) {
  if (src) {
    return /*#__PURE__*/React.createElement("img", _extends({
      src: src,
      alt: alt,
      style: {
        height,
        width: 'auto',
        display: 'block',
        filter: mono ? 'brightness(0) invert(1)' : undefined,
        ...style
      }
    }, rest));
  }
  // Typographic fallback (no icon reconstruction)
  const color = mono ? 'var(--lm-white)' : 'var(--color-brand)';
  return /*#__PURE__*/React.createElement("span", _extends({
    role: "img",
    "aria-label": alt,
    style: {
      display: 'inline-flex',
      flexDirection: 'column',
      lineHeight: .86,
      fontFamily: 'var(--font-display)',
      fontWeight: 'var(--fw-extrabold)',
      fontSize: height * 0.42,
      letterSpacing: '0.01em',
      color,
      textTransform: 'uppercase',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", null, "Long"), /*#__PURE__*/React.createElement("span", null, "Motive"));
}
Object.assign(__ds_scope, { Logo });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/brand/Logo.jsx", error: String((e && e.message) || e) }); }

// components/content/Badge.jsx
try { (() => {
const tones = {
  brand: {
    bg: 'var(--lm-blue-50)',
    fg: 'var(--lm-blue-700)'
  },
  accent: {
    bg: 'var(--lm-info-bg)',
    fg: 'var(--lm-cyan-700)'
  },
  neutral: {
    bg: 'var(--lm-slate-100)',
    fg: 'var(--lm-slate-700)'
  },
  success: {
    bg: 'var(--lm-success-bg)',
    fg: 'var(--lm-success)'
  },
  warning: {
    bg: 'var(--lm-warning-bg)',
    fg: '#b06f00'
  },
  danger: {
    bg: 'var(--lm-danger-bg)',
    fg: 'var(--lm-danger)'
  }
};
function Badge({
  children,
  tone = 'brand',
  solid = false,
  style
}) {
  const t = tones[tone] || tones.brand;
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '5px',
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--fs-overline)',
      fontWeight: 'var(--fw-semibold)',
      letterSpacing: 'var(--ls-wide)',
      textTransform: 'uppercase',
      padding: '4px 9px',
      borderRadius: 'var(--radius-xs)',
      background: solid ? t.fg : t.bg,
      color: solid ? '#fff' : t.fg,
      ...style
    }
  }, children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/content/Badge.jsx", error: String((e && e.message) || e) }); }

// components/content/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Card({
  children,
  media,
  mediaHeight = 200,
  interactive = false,
  accent = false,
  padding = 'var(--space-6)',
  style,
  onClick,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    className: interactive ? 'lm-card lm-card--interactive' : 'lm-card',
    onClick: onClick,
    style: {
      background: 'var(--surface-card)',
      border: 'var(--border-width) solid var(--border-subtle)',
      borderTop: accent ? 'var(--border-width-accent) solid var(--color-accent)' : undefined,
      borderRadius: 'var(--radius-md)',
      overflow: 'hidden',
      boxShadow: 'var(--shadow-sm)',
      display: 'flex',
      flexDirection: 'column',
      ...style
    }
  }, rest), media && /*#__PURE__*/React.createElement("div", {
    style: {
      height: mediaHeight,
      overflow: 'hidden',
      flexShrink: 0
    }
  }, typeof media === 'string' ? /*#__PURE__*/React.createElement("img", {
    src: media,
    alt: "",
    style: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      display: 'block'
    }
  }) : media), /*#__PURE__*/React.createElement("div", {
    style: {
      padding,
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-2)',
      flex: 1
    }
  }, children));
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/content/Card.jsx", error: String((e && e.message) || e) }); }

// components/content/SectionHeading.jsx
try { (() => {
function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'left',
  onDark = false,
  style
}) {
  const center = align === 'center';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-3)',
      alignItems: center ? 'center' : 'flex-start',
      textAlign: center ? 'center' : 'left',
      maxWidth: center ? '720px' : undefined,
      marginLeft: center ? 'auto' : undefined,
      marginRight: center ? 'auto' : undefined,
      ...style
    }
  }, eyebrow && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '10px',
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--fs-overline)',
      fontWeight: 'var(--fw-semibold)',
      letterSpacing: 'var(--ls-overline)',
      textTransform: 'uppercase',
      color: onDark ? 'var(--lm-cyan-400)' : 'var(--color-accent)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: '28px',
      height: '2px',
      background: 'currentColor',
      display: 'inline-block'
    }
  }), eyebrow), title && /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      fontSize: 'var(--fs-display)',
      color: onDark ? 'var(--lm-white)' : 'var(--text-strong)',
      lineHeight: 'var(--lh-snug)',
      letterSpacing: 'var(--ls-tight)'
    }
  }, title), description && /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 'var(--fs-body-lg)',
      color: onDark ? 'var(--lm-blue-100)' : 'var(--text-muted)',
      lineHeight: 'var(--lh-relaxed)',
      maxWidth: '62ch'
    }
  }, description));
}
Object.assign(__ds_scope, { SectionHeading });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/content/SectionHeading.jsx", error: String((e && e.message) || e) }); }

// components/content/StatCard.jsx
try { (() => {
function StatCard({
  value,
  label,
  suffix,
  icon,
  align = 'left',
  onDark = false,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-1)',
      alignItems: align === 'center' ? 'center' : 'flex-start',
      textAlign: align === 'center' ? 'center' : 'left',
      ...style
    }
  }, icon && /*#__PURE__*/React.createElement("span", {
    style: {
      width: '32px',
      height: '32px',
      color: 'var(--color-accent)',
      marginBottom: 'var(--space-2)',
      display: 'inline-flex'
    }
  }, icon), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 'var(--fw-extrabold)',
      fontSize: 'var(--fs-display)',
      lineHeight: 1,
      letterSpacing: 'var(--ls-tight)',
      color: onDark ? 'var(--lm-white)' : 'var(--color-brand)'
    }
  }, value, suffix && /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--color-accent)'
    }
  }, suffix)), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--fs-body-sm)',
      fontWeight: 'var(--fw-medium)',
      color: onDark ? 'var(--lm-blue-100)' : 'var(--text-muted)',
      textTransform: 'uppercase',
      letterSpacing: 'var(--ls-wide)'
    }
  }, label));
}
Object.assign(__ds_scope, { StatCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/content/StatCard.jsx", error: String((e && e.message) || e) }); }

// components/content/Tag.jsx
try { (() => {
function Tag({
  children,
  active = false,
  icon,
  onClick,
  style
}) {
  const clickable = !!onClick;
  return /*#__PURE__*/React.createElement("span", {
    onClick: onClick,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      fontSize: 'var(--fs-body-sm)',
      fontWeight: 'var(--fw-medium)',
      padding: '6px 14px',
      borderRadius: 'var(--radius-pill)',
      border: 'var(--border-width) solid ' + (active ? 'var(--color-brand)' : 'var(--border-default)'),
      background: active ? 'var(--color-brand)' : 'var(--surface-card)',
      color: active ? 'var(--text-inverse)' : 'var(--text-body)',
      cursor: clickable ? 'pointer' : 'default',
      userSelect: 'none',
      transition: 'background var(--dur-fast),border-color var(--dur-fast),color var(--dur-fast)',
      ...style
    }
  }, icon && /*#__PURE__*/React.createElement("span", {
    style: {
      width: '15px',
      height: '15px',
      display: 'inline-flex'
    }
  }, icon), children);
}
Object.assign(__ds_scope, { Tag });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/content/Tag.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Alert.jsx
try { (() => {
const tones = {
  info: {
    bg: 'var(--lm-info-bg)',
    bar: 'var(--lm-cyan-500)',
    fg: 'var(--lm-cyan-700)'
  },
  success: {
    bg: 'var(--lm-success-bg)',
    bar: 'var(--lm-success)',
    fg: 'var(--lm-success)'
  },
  warning: {
    bg: 'var(--lm-warning-bg)',
    bar: 'var(--lm-warning)',
    fg: '#b06f00'
  },
  danger: {
    bg: 'var(--lm-danger-bg)',
    bar: 'var(--lm-danger)',
    fg: 'var(--lm-danger)'
  }
};
function Alert({
  title,
  children,
  tone = 'info',
  icon,
  onClose,
  style
}) {
  const t = tones[tone] || tones.info;
  return /*#__PURE__*/React.createElement("div", {
    role: "alert",
    style: {
      display: 'flex',
      gap: '12px',
      alignItems: 'flex-start',
      background: t.bg,
      borderLeft: 'var(--border-width-accent) solid ' + t.bar,
      borderRadius: 'var(--radius-sm)',
      padding: '14px 16px',
      ...style
    }
  }, icon && /*#__PURE__*/React.createElement("span", {
    style: {
      width: '20px',
      height: '20px',
      color: t.bar,
      flexShrink: 0,
      marginTop: '1px',
      display: 'inline-flex'
    }
  }, icon), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, title && /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 'var(--fw-semibold)',
      color: 'var(--text-strong)',
      fontSize: 'var(--fs-body)',
      marginBottom: children ? '2px' : 0
    }
  }, title), children && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--fs-body-sm)',
      color: 'var(--text-body)',
      lineHeight: 'var(--lh-normal)'
    }
  }, children)), onClose && /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    "aria-label": "Dismiss",
    style: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      color: 'var(--text-muted)',
      lineHeight: 0,
      padding: '2px',
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    width: "16",
    height: "16",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2.5"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M6 6l12 12M18 6L6 18"
  }))));
}
Object.assign(__ds_scope, { Alert });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Alert.jsx", error: String((e && e.message) || e) }); }

// components/forms/Checkbox.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Checkbox({
  label,
  checked,
  defaultChecked,
  onChange,
  disabled = false,
  id,
  style,
  ...rest
}) {
  const inputId = id || 'lm-' + Math.random().toString(36).slice(2, 8);
  return /*#__PURE__*/React.createElement("label", {
    className: "lm-checkbox",
    htmlFor: inputId,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '10px',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? .5 : 1,
      fontSize: 'var(--fs-body)',
      color: 'var(--text-body)',
      userSelect: 'none',
      ...style
    }
  }, /*#__PURE__*/React.createElement("input", _extends({
    id: inputId,
    type: "checkbox",
    checked: checked,
    defaultChecked: defaultChecked,
    onChange: onChange,
    disabled: disabled,
    style: {
      position: 'absolute',
      opacity: 0,
      width: 0,
      height: 0
    }
  }, rest)), /*#__PURE__*/React.createElement("span", {
    className: "lm-checkbox__box",
    style: {
      width: '20px',
      height: '20px',
      flexShrink: 0,
      borderRadius: 'var(--radius-xs)',
      border: `var(--border-width-strong) solid ${checked ?? defaultChecked ? 'var(--color-brand)' : 'var(--border-strong)'}`,
      background: checked ?? defaultChecked ? 'var(--color-brand)' : 'var(--surface-card)',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'background var(--dur-fast),border-color var(--dur-fast)'
    }
  }, (checked ?? defaultChecked) && /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    width: "14",
    height: "14",
    fill: "none",
    stroke: "#fff",
    strokeWidth: "3.5"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M5 12l5 5L19 7"
  }))), label);
}
Object.assign(__ds_scope, { Checkbox });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Checkbox.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Input({
  label,
  required = false,
  error,
  hint,
  id,
  type = 'text',
  iconLeft,
  style,
  wrapStyle,
  ...rest
}) {
  const inputId = id || 'lm-' + Math.random().toString(36).slice(2, 8);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
      ...wrapStyle
    }
  }, label && /*#__PURE__*/React.createElement("label", {
    htmlFor: inputId,
    style: {
      fontSize: 'var(--fs-body-sm)',
      fontWeight: 'var(--fw-semibold)',
      color: 'var(--text-strong)'
    }
  }, label, required && /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--lm-danger)',
      marginLeft: '2px'
    }
  }, "*")), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      display: 'flex',
      alignItems: 'center'
    }
  }, iconLeft && /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      left: '12px',
      width: '18px',
      height: '18px',
      color: 'var(--text-muted)',
      display: 'inline-flex'
    }
  }, iconLeft), /*#__PURE__*/React.createElement("input", _extends({
    id: inputId,
    type: type,
    className: "lm-field",
    style: {
      width: '100%',
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--fs-body)',
      color: 'var(--text-strong)',
      background: 'var(--surface-card)',
      border: `var(--border-width) solid ${error ? 'var(--lm-danger)' : 'var(--border-default)'}`,
      borderRadius: 'var(--radius-sm)',
      padding: iconLeft ? '11px 14px 11px 38px' : '11px 14px',
      transition: 'border-color var(--dur-fast),box-shadow var(--dur-fast)',
      ...style
    }
  }, rest))), error ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--fs-caption)',
      color: 'var(--lm-danger)'
    }
  }, error) : hint ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--fs-caption)',
      color: 'var(--text-muted)'
    }
  }, hint) : null);
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/forms/Select.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Select({
  label,
  required = false,
  error,
  hint,
  id,
  children,
  options,
  style,
  wrapStyle,
  ...rest
}) {
  const inputId = id || 'lm-' + Math.random().toString(36).slice(2, 8);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
      ...wrapStyle
    }
  }, label && /*#__PURE__*/React.createElement("label", {
    htmlFor: inputId,
    style: {
      fontSize: 'var(--fs-body-sm)',
      fontWeight: 'var(--fw-semibold)',
      color: 'var(--text-strong)'
    }
  }, label, required && /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--lm-danger)',
      marginLeft: '2px'
    }
  }, "*")), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("select", _extends({
    id: inputId,
    className: "lm-field",
    style: {
      width: '100%',
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--fs-body)',
      color: 'var(--text-strong)',
      background: 'var(--surface-card)',
      appearance: 'none',
      border: `var(--border-width) solid ${error ? 'var(--lm-danger)' : 'var(--border-default)'}`,
      borderRadius: 'var(--radius-sm)',
      padding: '11px 38px 11px 14px',
      cursor: 'pointer',
      ...style
    }
  }, rest), options ? options.map(o => {
    const val = typeof o === 'string' ? o : o.value;
    const lab = typeof o === 'string' ? o : o.label;
    return /*#__PURE__*/React.createElement("option", {
      key: val,
      value: val
    }, lab);
  }) : children), /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    width: "18",
    height: "18",
    fill: "none",
    stroke: "var(--text-muted)",
    strokeWidth: "2.5",
    style: {
      position: 'absolute',
      right: '12px',
      top: '50%',
      transform: 'translateY(-50%)',
      pointerEvents: 'none'
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M6 9l6 6 6-6"
  }))), error ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--fs-caption)',
      color: 'var(--lm-danger)'
    }
  }, error) : hint ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--fs-caption)',
      color: 'var(--text-muted)'
    }
  }, hint) : null);
}
Object.assign(__ds_scope, { Select });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Select.jsx", error: String((e && e.message) || e) }); }

// components/forms/Textarea.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Textarea({
  label,
  required = false,
  error,
  hint,
  id,
  rows = 4,
  style,
  wrapStyle,
  ...rest
}) {
  const inputId = id || 'lm-' + Math.random().toString(36).slice(2, 8);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
      ...wrapStyle
    }
  }, label && /*#__PURE__*/React.createElement("label", {
    htmlFor: inputId,
    style: {
      fontSize: 'var(--fs-body-sm)',
      fontWeight: 'var(--fw-semibold)',
      color: 'var(--text-strong)'
    }
  }, label, required && /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--lm-danger)',
      marginLeft: '2px'
    }
  }, "*")), /*#__PURE__*/React.createElement("textarea", _extends({
    id: inputId,
    rows: rows,
    className: "lm-field",
    style: {
      width: '100%',
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--fs-body)',
      color: 'var(--text-strong)',
      background: 'var(--surface-card)',
      resize: 'vertical',
      border: `var(--border-width) solid ${error ? 'var(--lm-danger)' : 'var(--border-default)'}`,
      borderRadius: 'var(--radius-sm)',
      padding: '11px 14px',
      lineHeight: 'var(--lh-normal)',
      ...style
    }
  }, rest)), error ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--fs-caption)',
      color: 'var(--lm-danger)'
    }
  }, error) : hint ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--fs-caption)',
      color: 'var(--text-muted)'
    }
  }, hint) : null);
}
Object.assign(__ds_scope, { Textarea });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Textarea.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/AboutScreen.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const React = window.React;
const {
  SectionHeading,
  StatCard,
  Card
} = window.LongmotiveDesignSystem_8d1e5c;
const I = window.LMIcons;
const IMG = '../../assets/img/';
const D = window.LMData;
const MAX = 'var(--container-max)';
function AboutScreen({
  onNav
}) {
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("section", {
    style: {
      background: 'var(--lm-gradient-deep)',
      padding: '72px var(--gutter) 60px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: MAX,
      margin: '0 auto'
    }
  }, /*#__PURE__*/React.createElement(SectionHeading, {
    onDark: true,
    eyebrow: "About Longmotive",
    title: "Chinese engineering heritage, delivered in Malaysia",
    description: "Longmotive (M) Sdn. Bhd. brings 20+ years of electromechanical experience and a deep talent pool to the Malaysian market."
  }))), /*#__PURE__*/React.createElement("section", {
    style: {
      padding: 'var(--section-y) var(--gutter)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: MAX,
      margin: '0 auto',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '56px',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
      boxShadow: 'var(--shadow-lg)',
      aspectRatio: '4/3'
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: IMG + 'prefab-workers.jpg',
    alt: "",
    style: {
      width: '100%',
      height: '100%',
      objectFit: 'cover'
    }
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(SectionHeading, {
    eyebrow: "Who We Are",
    title: "More than 20 years in electromechanical construction"
  }), /*#__PURE__*/React.createElement("p", {
    style: {
      color: 'var(--text-body)',
      fontSize: '16px',
      lineHeight: 1.7,
      marginTop: '18px'
    }
  }, "With over 20 years of experience in the electromechanical industry in China, Longmotive has reserved more than 100 professionals of various types and participated in the construction of more than 50 projects in the data-center industry."), /*#__PURE__*/React.createElement("p", {
    style: {
      color: 'var(--text-body)',
      fontSize: '16px',
      lineHeight: 1.7
    }
  }, "Each project is delivered with standardized construction, safe operation and efficient service. The Malaysian company relies on this accumulated experience and talent pool, combined with local resources, to better serve the economic construction of the region.")))), /*#__PURE__*/React.createElement("section", {
    style: {
      background: 'var(--lm-blue-900)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: MAX,
      margin: '0 auto',
      padding: '56px var(--gutter)',
      display: 'grid',
      gridTemplateColumns: 'repeat(4,1fr)',
      gap: '24px'
    }
  }, D.stats.map(s => /*#__PURE__*/React.createElement(StatCard, _extends({
    key: s.label
  }, s, {
    onDark: true
  }))))), /*#__PURE__*/React.createElement("section", {
    style: {
      padding: 'var(--section-y) var(--gutter)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: MAX,
      margin: '0 auto'
    }
  }, /*#__PURE__*/React.createElement(SectionHeading, {
    align: "center",
    eyebrow: "Our Philosophy",
    title: "Survival by quality. Development by technology. Growth by service.",
    description: "A win-win partnership with customers at affordable prices \u2014 the principles behind our robust and growing market."
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4,1fr)',
      gap: '22px',
      marginTop: '48px'
    }
  }, D.values.map(v => {
    const Ico = I[v.icon];
    return /*#__PURE__*/React.createElement(Card, {
      key: v.title,
      padding: "24px",
      accent: true
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--color-accent)',
        marginBottom: '8px',
        display: 'inline-flex'
      }
    }, /*#__PURE__*/React.createElement(Ico, {
      size: 26
    })), /*#__PURE__*/React.createElement("h3", {
      style: {
        margin: '2px 0 4px',
        fontSize: '18px'
      }
    }, v.title), /*#__PURE__*/React.createElement("p", {
      style: {
        margin: 0,
        fontSize: '14px',
        color: 'var(--text-muted)',
        lineHeight: 1.55
      }
    }, v.desc));
  })))));
}
window.AboutScreen = AboutScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/AboutScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/App.jsx
try { (() => {
const React = window.React;
const {
  SiteHeader,
  SiteFooter,
  HomeScreen,
  AboutScreen,
  ServicesScreen,
  ProjectsScreen,
  ContactScreen
} = window;
function App() {
  const [screen, setScreen] = React.useState('Home');
  const nav = n => {
    setScreen(n);
    window.scrollTo && window.scrollTo({
      top: 0
    });
    document.getElementById('lm-scroll') && (document.getElementById('lm-scroll').scrollTop = 0);
  };
  const S = {
    Home: HomeScreen,
    About: AboutScreen,
    Services: ServicesScreen,
    Projects: ProjectsScreen,
    Contact: ContactScreen
  }[screen] || HomeScreen;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: '100%',
      display: 'flex',
      flexDirection: 'column'
    }
  }, /*#__PURE__*/React.createElement(SiteHeader, {
    active: screen,
    onNav: nav
  }), /*#__PURE__*/React.createElement("main", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement(S, {
    onNav: nav
  })), /*#__PURE__*/React.createElement(SiteFooter, {
    onNav: nav
  }));
}
ReactDOM.createRoot(document.getElementById('root')).render(/*#__PURE__*/React.createElement(App, null));
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/App.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/ContactScreen.jsx
try { (() => {
const React = window.React;
const {
  SectionHeading,
  Input,
  Select,
  Textarea,
  Checkbox,
  Button,
  Alert
} = window.LongmotiveDesignSystem_8d1e5c;
const I = window.LMIcons;
const MAX = 'var(--container-max)';
function InfoLine({
  icon,
  label,
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: '14px',
      marginBottom: '22px'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: '42px',
      height: '42px',
      flexShrink: 0,
      borderRadius: 'var(--radius-sm)',
      background: 'var(--lm-blue-50)',
      color: 'var(--color-brand)',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, icon), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: '11px',
      letterSpacing: '.1em',
      textTransform: 'uppercase',
      color: 'var(--text-muted)',
      marginBottom: '3px'
    }
  }, label), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '15px',
      color: 'var(--text-strong)',
      lineHeight: 1.5
    }
  }, children)));
}
function ContactScreen() {
  const [sent, setSent] = React.useState(false);
  const [err, setErr] = React.useState(false);
  const [v, setV] = React.useState({
    name: '',
    email: '',
    contact: '',
    subject: '',
    message: ''
  });
  const set = k => e => setV(s => ({
    ...s,
    [k]: e.target.value
  }));
  const submit = e => {
    e.preventDefault();
    if (!v.name || !v.email || !v.contact || !v.subject || !v.message) {
      setErr(true);
      setSent(false);
      return;
    }
    setErr(false);
    setSent(true);
  };
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("section", {
    style: {
      background: 'var(--lm-gradient-deep)',
      padding: '64px var(--gutter) 52px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: MAX,
      margin: '0 auto'
    }
  }, /*#__PURE__*/React.createElement(SectionHeading, {
    onDark: true,
    eyebrow: "Get In Touch",
    title: "Submit Your Enquiry",
    description: "We welcome any inquiries or favorable feedback. Submit via the form below or email us at info@longmotive.com \u2014 we'll reply as soon as possible."
  }))), /*#__PURE__*/React.createElement("section", {
    style: {
      padding: 'var(--section-y) var(--gutter)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: MAX,
      margin: '0 auto',
      display: 'grid',
      gridTemplateColumns: '0.85fr 1.15fr',
      gap: '56px'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", {
    style: {
      fontSize: '15px',
      textTransform: 'uppercase',
      letterSpacing: '.08em',
      color: 'var(--text-strong)',
      marginBottom: '22px'
    }
  }, "Business Office"), /*#__PURE__*/React.createElement(InfoLine, {
    icon: /*#__PURE__*/React.createElement(I.MapPin, {
      size: 20
    }),
    label: "Address"
  }, "No. 9, Jalan Teknologi Perintis 1/2,", /*#__PURE__*/React.createElement("br", null), "Taman Teknologi Nusajaya,", /*#__PURE__*/React.createElement("br", null), "79250 Iskandar Puteri, Johor."), /*#__PURE__*/React.createElement(InfoLine, {
    icon: /*#__PURE__*/React.createElement(I.Phone, {
      size: 20
    }),
    label: "Phone"
  }, "+607-550 5651"), /*#__PURE__*/React.createElement(InfoLine, {
    icon: /*#__PURE__*/React.createElement(I.Mail, {
      size: 20
    }),
    label: "Email"
  }, "info@longmotive.com"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: '26px',
      padding: '16px 18px',
      background: 'var(--surface-subtle)',
      borderRadius: 'var(--radius-md)',
      fontFamily: 'var(--font-mono)',
      fontSize: '11px',
      lineHeight: 1.7,
      color: 'var(--text-muted)'
    }
  }, "LONGMOTIVE (M) SDN. BHD.", /*#__PURE__*/React.createElement("br", null), "202201027398 (1473095-A)")), /*#__PURE__*/React.createElement("div", {
    style: {
      background: '#fff',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-md)',
      padding: '32px'
    }
  }, sent && /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: '20px'
    }
  }, /*#__PURE__*/React.createElement(Alert, {
    tone: "success",
    title: "Enquiry received",
    onClose: () => setSent(false)
  }, "Thank you \u2014 we'll get back to you as soon as possible.")), err && /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: '20px'
    }
  }, /*#__PURE__*/React.createElement(Alert, {
    tone: "danger",
    title: "Please complete all mandatory fields",
    onClose: () => setErr(false)
  }, "Fields marked with * are required.")), /*#__PURE__*/React.createElement("form", {
    onSubmit: submit,
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '18px'
    }
  }, /*#__PURE__*/React.createElement(Select, {
    label: "Salutation",
    wrapStyle: {
      gridColumn: '1 / -1'
    },
    options: ['~ Please select one. ~', 'Mr.', 'Ms.', 'Mdm.', 'Dr.']
  }), /*#__PURE__*/React.createElement(Input, {
    label: "Name",
    required: true,
    placeholder: "Name*",
    value: v.name,
    onChange: set('name')
  }), /*#__PURE__*/React.createElement(Input, {
    label: "Company Name",
    placeholder: "Company Name"
  }), /*#__PURE__*/React.createElement(Input, {
    label: "Contact No.",
    required: true,
    placeholder: "Contact No.*",
    value: v.contact,
    onChange: set('contact')
  }), /*#__PURE__*/React.createElement(Input, {
    label: "Email",
    required: true,
    type: "email",
    placeholder: "Email*",
    value: v.email,
    onChange: set('email')
  }), /*#__PURE__*/React.createElement(Input, {
    label: "Subject",
    required: true,
    wrapStyle: {
      gridColumn: '1 / -1'
    },
    placeholder: "Subject*",
    value: v.subject,
    onChange: set('subject')
  }), /*#__PURE__*/React.createElement(Textarea, {
    label: "Message",
    required: true,
    wrapStyle: {
      gridColumn: '1 / -1'
    },
    rows: 5,
    placeholder: "Message",
    value: v.message,
    onChange: set('message')
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      gridColumn: '1 / -1',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '14px'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '12px',
      color: 'var(--lm-danger)'
    }
  }, "* indicates mandatory field"), /*#__PURE__*/React.createElement(Button, {
    type: "submit",
    iconRight: /*#__PURE__*/React.createElement(I.Arrow, {
      size: 16
    })
  }, "Submit")))))));
}
window.ContactScreen = ContactScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/ContactScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/HomeScreen.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const React = window.React;
const {
  Button,
  SectionHeading,
  StatCard,
  Card,
  Badge,
  Tag
} = window.LongmotiveDesignSystem_8d1e5c;
const I = window.LMIcons;
const IMG = '../../assets/img/';
const D = window.LMData;
const MAX = 'var(--container-max)';
function Section({
  children,
  style,
  bg
}) {
  return /*#__PURE__*/React.createElement("section", {
    style: {
      background: bg,
      padding: 'var(--section-y) var(--gutter)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: MAX,
      margin: '0 auto',
      ...style
    }
  }, children));
}
function Hero({
  onNav
}) {
  return /*#__PURE__*/React.createElement("section", {
    style: {
      position: 'relative',
      overflow: 'hidden',
      background: 'var(--lm-blue-900)'
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: IMG + 'datacenter-aerial.jpg',
    alt: "",
    style: {
      position: 'absolute',
      inset: 0,
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      opacity: 1
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      background: 'linear-gradient(90deg,rgba(7,36,72,.88) 0%,rgba(7,36,72,.62) 30%,rgba(7,36,72,.2) 52%,rgba(7,36,72,0) 68%)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      maxWidth: MAX,
      margin: '0 auto',
      padding: '112px var(--gutter) 104px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '10px',
      fontFamily: 'var(--font-mono)',
      fontSize: '12px',
      fontWeight: 600,
      letterSpacing: '.14em',
      textTransform: 'uppercase',
      color: 'var(--lm-cyan-400)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: '30px',
      height: '2px',
      background: 'currentColor'
    }
  }), "Electromechanical Construction"), /*#__PURE__*/React.createElement("h1", {
    style: {
      color: '#fff',
      fontSize: 'var(--fs-display-lg)',
      lineHeight: 1.02,
      margin: '20px 0 0',
      maxWidth: '18ch'
    }
  }, "Building the MEP backbone of the data-center era."), /*#__PURE__*/React.createElement("p", {
    style: {
      color: 'var(--lm-blue-100)',
      fontSize: '19px',
      lineHeight: 1.6,
      maxWidth: '56ch',
      margin: '22px 0 34px'
    }
  }, "Over 20 years of electromechanical expertise and 100+ professionals, now serving Malaysia from Iskandar Puteri, Johor \u2014 standardized construction, safe operation, efficient service."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: '14px',
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "accent",
    size: "lg",
    onClick: () => onNav('Projects'),
    iconRight: /*#__PURE__*/React.createElement(I.Arrow, {
      size: 17
    })
  }, "View Projects"), /*#__PURE__*/React.createElement(Button, {
    variant: "inverse",
    size: "lg",
    onClick: () => onNav('Contact')
  }, "Submit Enquiry"))));
}
function StatStrip() {
  return /*#__PURE__*/React.createElement("section", {
    style: {
      background: 'var(--lm-blue-700)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: MAX,
      margin: '0 auto',
      padding: '40px var(--gutter)',
      display: 'grid',
      gridTemplateColumns: 'repeat(4,1fr)',
      gap: '24px'
    }
  }, D.stats.map(s => /*#__PURE__*/React.createElement(StatCard, _extends({
    key: s.label
  }, s, {
    onDark: true
  })))));
}
function Services({
  onNav
}) {
  return /*#__PURE__*/React.createElement(Section, {
    bg: "var(--surface-page)"
  }, /*#__PURE__*/React.createElement(SectionHeading, {
    align: "center",
    eyebrow: "What We Do",
    title: "Full-scope electromechanical delivery",
    description: "One accountable contractor across every MEP discipline \u2014 from BIM coordination to on-site commissioning."
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3,1fr)',
      gap: '22px',
      marginTop: '48px'
    }
  }, D.services.map(s => {
    const Ico = I[s.icon];
    return /*#__PURE__*/React.createElement(Card, {
      key: s.title,
      padding: "26px",
      interactive: true
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: '46px',
        height: '46px',
        borderRadius: 'var(--radius-sm)',
        background: 'var(--lm-blue-50)',
        color: 'var(--color-brand)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '6px'
      }
    }, /*#__PURE__*/React.createElement(Ico, {
      size: 24
    })), /*#__PURE__*/React.createElement("h3", {
      style: {
        margin: '4px 0 2px',
        fontSize: '21px'
      }
    }, s.title), /*#__PURE__*/React.createElement("p", {
      style: {
        margin: 0,
        fontSize: '15px',
        color: 'var(--text-muted)',
        lineHeight: 1.55
      }
    }, s.desc));
  })));
}
function FeaturedProjects({
  onNav
}) {
  const items = D.projects.slice(0, 3);
  return /*#__PURE__*/React.createElement(Section, {
    bg: "var(--surface-subtle)"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      gap: '24px',
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement(SectionHeading, {
    eyebrow: "Selected Work",
    title: "Projects built to spec, on schedule"
  }), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    onClick: () => onNav('Projects'),
    iconRight: /*#__PURE__*/React.createElement(I.Arrow, {
      size: 15
    })
  }, "All Projects")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3,1fr)',
      gap: '22px',
      marginTop: '40px'
    }
  }, items.map(p => /*#__PURE__*/React.createElement(Card, {
    key: p.title,
    media: IMG + p.img,
    mediaHeight: 190,
    interactive: true,
    accent: true,
    padding: "20px",
    onClick: () => onNav('Projects')
  }, /*#__PURE__*/React.createElement(Badge, {
    tone: "accent"
  }, p.cat), /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: '8px 0 3px',
      fontSize: '19px'
    }
  }, p.title), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: '13px',
      color: 'var(--text-muted)',
      fontFamily: 'var(--font-mono)'
    }
  }, p.meta)))));
}
function ValueBand() {
  return /*#__PURE__*/React.createElement(Section, {
    bg: "var(--surface-page)"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1.1fr 1fr',
      gap: '56px',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(SectionHeading, {
    eyebrow: "Our Principles",
    title: "A robust market, earned project by project",
    description: "Relying on a strong team and the right development philosophy, Longmotive has steadily built a dependable presence in the electromechanical industry."
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '22px',
      marginTop: '34px'
    }
  }, D.values.map(v => {
    const Ico = I[v.icon];
    return /*#__PURE__*/React.createElement("div", {
      key: v.title,
      style: {
        display: 'flex',
        gap: '12px'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--color-accent)',
        flexShrink: 0
      }
    }, /*#__PURE__*/React.createElement(Ico, {
      size: 22
    })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        fontWeight: 700,
        fontSize: '15px',
        color: 'var(--text-strong)',
        marginBottom: '2px'
      }
    }, v.title), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: '13.5px',
        color: 'var(--text-muted)',
        lineHeight: 1.5
      }
    }, v.desc)));
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
      boxShadow: 'var(--shadow-lg)',
      aspectRatio: '4/5'
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: IMG + 'cooling-tower-works.jpg',
    alt: "",
    style: {
      width: '100%',
      height: '100%',
      objectFit: 'cover'
    }
  }))));
}
function CTA({
  onNav
}) {
  return /*#__PURE__*/React.createElement("section", {
    style: {
      background: 'var(--lm-gradient-brand)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: MAX,
      margin: '0 auto',
      padding: '72px var(--gutter)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: '32px',
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    style: {
      color: '#fff',
      fontSize: 'var(--fs-display)',
      margin: '0 0 8px'
    }
  }, "Have a project in mind?"), /*#__PURE__*/React.createElement("p", {
    style: {
      color: 'rgba(255,255,255,.9)',
      fontSize: '18px',
      margin: 0
    }
  }, "Tell us the scope \u2014 we'll bring the team, the technology and the track record.")), /*#__PURE__*/React.createElement(Button, {
    variant: "inverse",
    size: "lg",
    onClick: () => onNav('Contact'),
    iconRight: /*#__PURE__*/React.createElement(I.Arrow, {
      size: 17
    })
  }, "Submit Enquiry")));
}
function HomeScreen({
  onNav
}) {
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Hero, {
    onNav: onNav
  }), /*#__PURE__*/React.createElement(StatStrip, null), /*#__PURE__*/React.createElement(Services, {
    onNav: onNav
  }), /*#__PURE__*/React.createElement(FeaturedProjects, {
    onNav: onNav
  }), /*#__PURE__*/React.createElement(ValueBand, null), /*#__PURE__*/React.createElement(CTA, {
    onNav: onNav
  }));
}
window.HomeScreen = HomeScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/HomeScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/Icons.jsx
try { (() => {
// Line icon set for the Longmotive website UI kit (stroke, 2px, currentColor).
const React = window.React;
function mk(path, extra) {
  return function Icon({
    size = 24,
    style,
    ...r
  }) {
    return React.createElement('svg', {
      viewBox: '0 0 24 24',
      width: size,
      height: size,
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: 2,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      style,
      ...r,
      dangerouslySetInnerHTML: {
        __html: path
      }
    });
  };
}
const Icons = {
  Menu: mk('<path d="M4 6h16M4 12h16M4 18h16"/>'),
  Close: mk('<path d="M6 6l12 12M18 6L6 18"/>'),
  Search: mk('<circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/>'),
  Arrow: mk('<path d="M5 12h14M13 6l6 6-6 6"/>'),
  ChevronDown: mk('<path d="M6 9l6 6 6-6"/>'),
  Phone: mk('<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.1-8.6A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.7a2 2 0 0 1-.5 2.1L8 9.6a16 16 0 0 0 6 6l1.1-1.1a2 2 0 0 1 2.1-.5c.9.3 1.8.5 2.7.6a2 2 0 0 1 1.7 2z"/>'),
  Mail: mk('<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>'),
  MapPin: mk('<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>'),
  Check: mk('<path d="M20 6 9 17l-5-5"/>'),
  CheckCircle: mk('<path d="M22 11.1V12a10 10 0 1 1-5.9-9.1"/><path d="M22 4 12 14.1l-3-3"/>'),
  Wind: mk('<path d="M17.7 7.7A2.5 2.5 0 1 1 19.5 12H2"/><path d="M9.6 4.6A2 2 0 1 1 11 8H2"/><path d="M12.6 19.4A2 2 0 1 0 14 16H2"/>'),
  Zap: mk('<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>'),
  Flame: mk('<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.4-.5-2-1-3-1.1-2-.5-4 1-5.5.6 3 2.5 5 4 6 1.5 1 2 2.5 2 4a5 5 0 1 1-10 0c0-.5 0-1 .5-2z"/>'),
  Droplet: mk('<path d="M12 2.7 6.3 8.4a8 8 0 1 0 11.4 0z"/>'),
  Cpu: mk('<rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3"/>'),
  Wrench: mk('<path d="M14.7 6.3a4 4 0 0 0-5.2 5.2L3 18l3 3 6.5-6.5a4 4 0 0 0 5.2-5.2l-2.7 2.7-2.3-2.3 2.7-2.7z"/>'),
  Shield: mk('<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>'),
  Clock: mk('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  Building: mk('<rect x="4" y="2" width="16" height="20" rx="1"/><path d="M9 22v-4h6v4M8 6h.01M12 6h.01M16 6h.01M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01"/>'),
  Users: mk('<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>'),
  Layers: mk('<path d="m12 2 9 5-9 5-9-5 9-5z"/><path d="m3 12 9 5 9-5M3 17l9 5 9-5"/>')
};
window.LMIcons = Icons;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/Icons.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/ProjectsScreen.jsx
try { (() => {
const React = window.React;
const {
  SectionHeading,
  Card,
  Badge,
  Tag
} = window.LongmotiveDesignSystem_8d1e5c;
const IMG = '../../assets/img/';
const D = window.LMData;
const FILTERS = ['All', 'HVAC', 'Electrical', 'Piping', 'BIM'];
function ProjectsScreen({
  onNav
}) {
  const [f, setF] = React.useState('All');
  const list = f === 'All' ? D.projects : D.projects.filter(p => p.tags.includes(f));
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("section", {
    style: {
      background: 'var(--lm-gradient-deep)',
      padding: '72px var(--gutter) 60px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 'var(--container-max)',
      margin: '0 auto'
    }
  }, /*#__PURE__*/React.createElement(SectionHeading, {
    onDark: true,
    eyebrow: "Portfolio",
    title: "Projects",
    description: "A selection of electromechanical works delivered for the data-center industry and beyond."
  }))), /*#__PURE__*/React.createElement("section", {
    style: {
      padding: '40px var(--gutter) var(--section-y)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 'var(--container-max)',
      margin: '0 auto'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: '10px',
      flexWrap: 'wrap',
      marginBottom: '32px'
    }
  }, FILTERS.map(t => /*#__PURE__*/React.createElement(Tag, {
    key: t,
    active: f === t,
    onClick: () => setF(t)
  }, t))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3,1fr)',
      gap: '24px'
    }
  }, list.map(p => /*#__PURE__*/React.createElement(Card, {
    key: p.title,
    media: IMG + p.img,
    mediaHeight: 200,
    interactive: true,
    padding: "20px"
  }, /*#__PURE__*/React.createElement(Badge, {
    tone: "accent"
  }, p.cat), /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: '8px 0 4px',
      fontSize: '20px'
    }
  }, p.title), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '0 0 12px',
      fontSize: '13px',
      color: 'var(--text-muted)',
      fontFamily: 'var(--font-mono)'
    }
  }, p.meta), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: '6px',
      flexWrap: 'wrap',
      marginTop: 'auto'
    }
  }, p.tags.map(t => /*#__PURE__*/React.createElement(Badge, {
    key: t,
    tone: "neutral"
  }, t)))))), list.length === 0 && /*#__PURE__*/React.createElement("p", {
    style: {
      color: 'var(--text-muted)'
    }
  }, "No projects in this category."))));
}
window.ProjectsScreen = ProjectsScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/ProjectsScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/ServicesScreen.jsx
try { (() => {
const React = window.React;
const {
  SectionHeading,
  Card
} = window.LongmotiveDesignSystem_8d1e5c;
const I = window.LMIcons;
const D = window.LMData;
const MAX = 'var(--container-max)';
function ServicesScreen({
  onNav
}) {
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("section", {
    style: {
      background: 'var(--lm-gradient-deep)',
      padding: '72px var(--gutter) 60px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: MAX,
      margin: '0 auto'
    }
  }, /*#__PURE__*/React.createElement(SectionHeading, {
    onDark: true,
    eyebrow: "Capabilities",
    title: "Services",
    description: "A single accountable contractor across every electromechanical discipline, backed by BIM and in-house prefabrication."
  }))), /*#__PURE__*/React.createElement("section", {
    style: {
      padding: 'var(--section-y) var(--gutter)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: MAX,
      margin: '0 auto',
      display: 'grid',
      gridTemplateColumns: 'repeat(2,1fr)',
      gap: '24px'
    }
  }, D.services.map((s, i) => {
    const Ico = I[s.icon];
    return /*#__PURE__*/React.createElement(Card, {
      key: s.title,
      padding: "30px",
      style: {
        flexDirection: 'row',
        gap: '20px',
        alignItems: 'flex-start'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: '56px',
        height: '56px',
        flexShrink: 0,
        borderRadius: 'var(--radius-md)',
        background: 'var(--lm-gradient-brand)',
        color: '#fff',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center'
      }
    }, /*#__PURE__*/React.createElement(Ico, {
      size: 28
    })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: 'var(--font-mono)',
        fontSize: '11px',
        color: 'var(--text-muted)',
        letterSpacing: '.1em'
      }
    }, String(i + 1).padStart(2, '0')), /*#__PURE__*/React.createElement("h3", {
      style: {
        margin: '2px 0 6px',
        fontSize: '22px'
      }
    }, s.title), /*#__PURE__*/React.createElement("p", {
      style: {
        margin: 0,
        fontSize: '15px',
        color: 'var(--text-muted)',
        lineHeight: 1.6
      }
    }, s.desc)));
  }))));
}
window.ServicesScreen = ServicesScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/ServicesScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/SiteChrome.jsx
try { (() => {
const React = window.React;
const {
  Logo,
  Button
} = window.LongmotiveDesignSystem_8d1e5c;
const I = window.LMIcons;
const LOGO = '../../assets/logo.png';
const NAV = ['Home', 'About', 'Services', 'Projects', 'Contact'];
function SiteHeader({
  active,
  onNav
}) {
  const [scrolled, setScrolled] = React.useState(false);
  return /*#__PURE__*/React.createElement("header", {
    style: {
      position: 'sticky',
      top: 0,
      zIndex: 20,
      background: 'rgba(255,255,255,.92)',
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid var(--border-subtle)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 'var(--container-max)',
      margin: '0 auto',
      padding: '0 var(--gutter)',
      height: '72px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '24px'
    }
  }, /*#__PURE__*/React.createElement("a", {
    onClick: () => onNav('Home'),
    style: {
      cursor: 'pointer',
      display: 'flex'
    }
  }, /*#__PURE__*/React.createElement(Logo, {
    src: LOGO,
    height: 40
  })), /*#__PURE__*/React.createElement("nav", {
    style: {
      display: 'flex',
      gap: '4px',
      alignItems: 'center'
    }
  }, NAV.map(n => /*#__PURE__*/React.createElement("a", {
    key: n,
    onClick: () => onNav(n),
    style: {
      cursor: 'pointer',
      padding: '8px 14px',
      fontSize: '14px',
      fontWeight: 600,
      fontFamily: 'var(--font-display)',
      textTransform: 'uppercase',
      letterSpacing: '.03em',
      color: active === n ? 'var(--color-brand)' : 'var(--text-body)',
      borderBottom: active === n ? '2px solid var(--color-accent)' : '2px solid transparent'
    }
  }, n))), /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    onClick: () => onNav('Contact'),
    iconRight: /*#__PURE__*/React.createElement(I.Arrow, {
      size: 15
    })
  }, "Enquire")));
}
function SiteFooter({
  onNav
}) {
  return /*#__PURE__*/React.createElement("footer", {
    style: {
      background: 'var(--lm-blue-900)',
      color: 'var(--lm-blue-100)',
      marginTop: '0'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 'var(--container-max)',
      margin: '0 auto',
      padding: '56px var(--gutter) 32px',
      display: 'grid',
      gridTemplateColumns: '1.6fr 1fr 1.4fr',
      gap: '40px'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Logo, {
    src: LOGO,
    height: 40,
    mono: true
  }), /*#__PURE__*/React.createElement("p", {
    style: {
      marginTop: '16px',
      fontSize: '14px',
      lineHeight: 1.6,
      maxWidth: '40ch',
      color: 'var(--lm-blue-200)'
    }
  }, "Electromechanical construction contractor delivering standardized, safe and efficient MEP works for the data-center industry across Malaysia and China."), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: '11px',
      letterSpacing: '.06em',
      color: 'var(--lm-blue-300)',
      marginTop: '18px'
    }
  }, "LONGMOTIVE (M) SDN. BHD. \xB7 202201027398 (1473095-A)")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h4", {
    style: {
      color: '#fff',
      fontSize: '13px',
      textTransform: 'uppercase',
      letterSpacing: '.1em',
      marginBottom: '14px'
    }
  }, "Explore"), NAV.map(n => /*#__PURE__*/React.createElement("div", {
    key: n,
    style: {
      marginBottom: '9px'
    }
  }, /*#__PURE__*/React.createElement("a", {
    onClick: () => onNav(n),
    style: {
      cursor: 'pointer',
      color: 'var(--lm-blue-200)',
      fontSize: '14px'
    }
  }, n)))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h4", {
    style: {
      color: '#fff',
      fontSize: '13px',
      textTransform: 'uppercase',
      letterSpacing: '.1em',
      marginBottom: '14px'
    }
  }, "Business Office"), /*#__PURE__*/React.createElement(Row, {
    icon: /*#__PURE__*/React.createElement(I.MapPin, {
      size: 17
    })
  }, "No. 9, Jalan Teknologi Perintis 1/2,", /*#__PURE__*/React.createElement("br", null), "Taman Teknologi Nusajaya,", /*#__PURE__*/React.createElement("br", null), "79250 Iskandar Puteri, Johor."), /*#__PURE__*/React.createElement(Row, {
    icon: /*#__PURE__*/React.createElement(I.Phone, {
      size: 17
    })
  }, "+607-550 5651"), /*#__PURE__*/React.createElement(Row, {
    icon: /*#__PURE__*/React.createElement(I.Mail, {
      size: 17
    })
  }, "info@longmotive.com"))), /*#__PURE__*/React.createElement("div", {
    style: {
      borderTop: '1px solid rgba(255,255,255,.1)',
      padding: '18px var(--gutter)',
      maxWidth: 'var(--container-max)',
      margin: '0 auto',
      fontSize: '12px',
      color: 'var(--lm-blue-300)',
      display: 'flex',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '8px'
    }
  }, /*#__PURE__*/React.createElement("span", null, "\xA9 2026 Longmotive (M) Sdn. Bhd. All rights reserved."), /*#__PURE__*/React.createElement("span", null, "Survival by quality \xB7 Development by technology \xB7 Growth by service")));
}
function Row({
  icon,
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: '10px',
      marginBottom: '12px',
      fontSize: '14px',
      lineHeight: 1.5,
      color: 'var(--lm-blue-200)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--color-accent)',
      flexShrink: 0,
      marginTop: '2px'
    }
  }, icon), /*#__PURE__*/React.createElement("span", null, children));
}
Object.assign(window, {
  SiteHeader,
  SiteFooter
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/SiteChrome.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/data.js
try { (() => {
// Shared content data for the Longmotive website UI kit.
window.LMData = {
  services: [{
    icon: 'Wind',
    title: 'HVAC & Chilled Water',
    desc: 'Central plant rooms, cooling towers, AHUs and chilled-water reticulation for high-density data centers.'
  }, {
    icon: 'Zap',
    title: 'Electrical & Power',
    desc: 'MV/LV distribution, busway, generators, UPS and switchgear installation and commissioning.'
  }, {
    icon: 'Flame',
    title: 'Fire Protection',
    desc: 'Sprinkler, gaseous suppression and fire-fighting pump systems to international standards.'
  }, {
    icon: 'Droplet',
    title: 'Plumbing & Drainage',
    desc: 'Domestic water, drainage, and process piping fabricated and installed to spec.'
  }, {
    icon: 'Cpu',
    title: 'BIM Coordination',
    desc: 'Full 3D MEP modelling, clash detection and prefabrication drawings before a pipe is cut.'
  }, {
    icon: 'Wrench',
    title: 'Prefabrication',
    desc: 'Automated pipe-spool cutting, beveling and welding in our controlled fabrication yard.'
  }],
  stats: [{
    value: '20',
    suffix: '+',
    label: 'Years Experience'
  }, {
    value: '50',
    suffix: '+',
    label: 'Data-Center Projects'
  }, {
    value: '100',
    suffix: '+',
    label: 'Professionals'
  }, {
    value: '100',
    suffix: '%',
    label: 'QA / QC Coverage'
  }],
  projects: [{
    img: 'datacenter-aerial.jpg',
    cat: 'Data Center',
    title: 'Hyperscale Campus — Sedenak',
    meta: 'MEP · 120 MW IT load',
    tags: ['HVAC', 'Electrical']
  }, {
    img: 'chiller-plant.jpg',
    cat: 'Chilled Water',
    title: 'Central Chiller Plant Room',
    meta: 'Turnkey install & commissioning',
    tags: ['HVAC', 'Piping']
  }, {
    img: 'bim-plantroom.jpg',
    cat: 'BIM / MEP',
    title: 'Plant Room 3D Coordination',
    meta: 'Clash-free prefab model',
    tags: ['BIM']
  }, {
    img: 'server-cabling.jpg',
    cat: 'Electrical',
    title: 'Structured Cabling & Containment',
    meta: 'Data hall fit-out',
    tags: ['Electrical']
  }, {
    img: 'prefab-workers.jpg',
    cat: 'Prefabrication',
    title: 'Pipe Spool Fabrication Yard',
    meta: 'Automated cut / bevel / weld',
    tags: ['Piping']
  }, {
    img: 'pipe-stock.jpg',
    cat: 'Piping',
    title: 'Large-Bore Pipe Supply',
    meta: 'DN400–DN800 flanged spools',
    tags: ['Piping']
  }],
  values: [{
    icon: 'Shield',
    title: 'Survival by Quality',
    desc: 'Standardized construction and rigorous QA/QC on every project.'
  }, {
    icon: 'Cpu',
    title: 'Development by Technology',
    desc: 'BIM-led coordination and automated prefabrication.'
  }, {
    icon: 'Users',
    title: 'Growth by Service',
    desc: 'Efficient service and a win-win partnership with every client.'
  }, {
    icon: 'Clock',
    title: 'Safe, On-Time Delivery',
    desc: 'Safe operation and dependable schedules, project after project.'
  }]
};
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/data.js", error: String((e && e.message) || e) }); }

__ds_ns.Button = __ds_scope.Button;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.Logo = __ds_scope.Logo;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.SectionHeading = __ds_scope.SectionHeading;

__ds_ns.StatCard = __ds_scope.StatCard;

__ds_ns.Tag = __ds_scope.Tag;

__ds_ns.Alert = __ds_scope.Alert;

__ds_ns.Checkbox = __ds_scope.Checkbox;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.Select = __ds_scope.Select;

__ds_ns.Textarea = __ds_scope.Textarea;

})();
