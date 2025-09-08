from PySide6.QtWidgets import QWidget, QVBoxLayout, QFrame, QLineEdit, QLabel, QPushButton, QCheckBox, QHBoxLayout
from PySide6.QtCore import Qt
from ziva.gui.design import DesignModule
import os
import requests
import sys
from PySide6.QtGui import QPixmap

class AppState:
    username = None
    is_running = False


def _get_api_base() -> str:
    return 'https://browserclipboard.netlify.app'


def _get_hwid() -> str:
    try:
        if sys.platform == 'win32':
            import winreg
            key = winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE, r"SOFTWARE\\Microsoft\\Cryptography")
            val, _ = winreg.QueryValueEx(key, "MachineGuid")
            return str(val)
    except Exception:
        pass
    import uuid
    return str(uuid.getnode())


class AuthModule(QWidget):
    def __init__(self, parent):
        super().__init__(parent)
        self.parent = parent
        self._logo_pix = None
        self.logo_label = None
        self.form_container = None
        self.username_entry = None
        self.password_entry = None
        self.login_btn = None
        self.trial_btn = None
        self.error_label = None
        self._setup_ui()

    def _setup_ui(self):
        layout = QVBoxLayout(self)
        layout.setSpacing(16)

        # Top bar with close button (subtle)
        top_row = QHBoxLayout()
        top_row.setContentsMargins(0, 0, 0, 0)
        top_row.setSpacing(0)
        top_row.addStretch(1)
        close_btn = QPushButton('×')
        close_btn.setObjectName('winBtn')
        close_btn.setFlat(True)
        close_btn.setFixedSize(28, 22)
        close_btn.clicked.connect(self._close_window)
        top_row.addWidget(close_btn, alignment=Qt.AlignmentFlag.AlignRight)
        layout.addLayout(top_row)

        # Centered content area
        center_wrap = QVBoxLayout()
        center_wrap.setAlignment(Qt.AlignmentFlag.AlignCenter)
        center_wrap.setSpacing(16)

        # Logo (auto-scales)
        self.logo_label = QLabel()
        try:
            logo_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'resources', 'logo.png'))
            pix = QPixmap(logo_path)
            if not pix.isNull():
                self._logo_pix = pix
                self._scale_logo()
        except Exception:
            pass
        center_wrap.addWidget(self.logo_label, alignment=Qt.AlignmentFlag.AlignCenter)

        container = QFrame()
        self.form_container = container
        container.setStyleSheet('QFrame { background-color: rgba(18,22,30,230); border: 1px solid rgba(50,60,80,170); border-radius: 12px; }')
        self.container_layout = QVBoxLayout(container)
        self.container_layout.setContentsMargins(20, 20, 20, 20)
        self.container_layout.setSpacing(12)
        container.setMaximumWidth(640)

        input_style = (
            "QLineEdit { background-color: rgb(36,44,56); color: white; border: 1px solid rgb(50,60,80); border-radius: 8px; padding: 10px 12px; font-size: 13px; }"
            "QLineEdit:focus { border: 1px solid rgb(66,139,245); }"
        )
        label_chip_style = 'background-color: rgb(36,44,56); color: #e8eef8; border: 1px solid rgb(50,60,80); border-radius: 8px; padding: 8px 10px; font-size:13px; font-weight:600;'

        username_row = QHBoxLayout()
        username_label = QLabel('NyX ID')
        username_label.setStyleSheet(label_chip_style)
        username_row.addWidget(username_label)
        self.username_entry = QLineEdit()
        self.username_entry.setPlaceholderText('Username')
        self.username_entry.setStyleSheet(input_style)
        self.username_entry.setMinimumWidth(260)
        username_row.addWidget(self.username_entry)
        self.container_layout.addLayout(username_row)

        password_row = QHBoxLayout()
        password_label = QLabel('Passkey')
        password_label.setStyleSheet(label_chip_style)
        password_row.addWidget(password_label)
        self.password_entry = QLineEdit()
        self.password_entry.setEchoMode(QLineEdit.EchoMode.Password)
        self.password_entry.setPlaceholderText('Password')
        self.password_entry.setStyleSheet(input_style)
        self.password_entry.setMinimumWidth(260)
        password_row.addWidget(self.password_entry)
        self.container_layout.addLayout(password_row)

        self.show_password = QCheckBox('Show Password')
        self.container_layout.addWidget(self.show_password)
        self.show_password.stateChanged.connect(self._toggle_password_visibility)

        btn_row1 = QHBoxLayout()
        self.login_btn = QPushButton('Sign In')
        self.login_btn.setStyleSheet('QPushButton{background-color: rgb(36,44,56); color: white; border: 1px solid rgb(50,60,80); border-radius: 8px; padding: 10px 18px; font-size:13px;} QPushButton:hover{background-color: rgb(66,139,245);} PushButton:pressed{background-color: rgb(54,120,210);} QPushButton:disabled{background-color: rgb(32,38,48); color: #8c95a3;}')
        self.login_btn.clicked.connect(self._authenticate)
        btn_row1.addStretch(1)
        btn_row1.addWidget(self.login_btn)
        btn_row1.addStretch(1)
        self.container_layout.addLayout(btn_row1)

        btn_row2 = QHBoxLayout()
        self.trial_btn = QPushButton('Start Trial')
        self.trial_btn.setStyleSheet('QPushButton{background-color:#2ecc71; color:#0f131b; border: 1px solid #28b863; border-radius: 8px; padding: 10px 18px; font-weight:600; font-size:13px;} QPushButton:hover{background-color:#29c76b;} QPushButton:pressed{background-color:#25b463;} QPushButton:disabled{background-color:#2a6b45; color:#9ad9b7;}')
        self.trial_btn.clicked.connect(self._start_trial)
        btn_row2.addStretch(1)
        btn_row2.addWidget(self.trial_btn)
        btn_row2.addStretch(1)
        self.container_layout.addLayout(btn_row2)

        self.error_label = QLabel('')
        self.error_label.setStyleSheet('QLabel{color:#ff6b6b; background-color: rgba(255,107,107,20); border:1px solid rgba(255,107,107,60); border-radius:8px; padding:6px 10px; font-size:12px;}')
        self.error_label.hide()
        self.container_layout.addWidget(self.error_label, alignment=Qt.AlignmentFlag.AlignCenter)

        center_wrap.addWidget(container)
        layout.addLayout(center_wrap)
        self.setLayout(layout)

    def _scale_logo(self):
        try:
            if self._logo_pix:
                max_size = 440
                pw = self.parent.width() if hasattr(self.parent, 'width') else self.width()
                ph = self.parent.height() if hasattr(self.parent, 'height') else self.height()
                if not pw or not ph:
                    pw, ph = 820, 680
                # Target size is 35% of min dimension, clamped between 160 and 440
                base = int(min(pw, ph) * 0.35)
                size = max(160, min(max_size, base))
                self.logo_label.setPixmap(self._logo_pix.scaled(size, size, Qt.KeepAspectRatio, Qt.SmoothTransformation))
                # Responsively size the form container and inputs
                form_max = int(max(480, min(0.5 * pw, 680)))
                if self.form_container:
                    self.form_container.setMaximumWidth(form_max)
                entry_min = int(max(220, min(0.28 * pw, 380)))
                if self.username_entry:
                    self.username_entry.setMinimumWidth(entry_min)
                if self.password_entry:
                    self.password_entry.setMinimumWidth(entry_min)
        except Exception:
            pass

    def resizeEvent(self, event):
        super().resizeEvent(event)
        self._scale_logo()

    def _toggle_password_visibility(self):
        if self.show_password.isChecked():
            self.password_entry.setEchoMode(QLineEdit.EchoMode.Normal)
        else:
            self.password_entry.setEchoMode(QLineEdit.EchoMode.Password)

    def _set_loading(self, signing_in: bool = False, starting_trial: bool = False):
        try:
            if signing_in:
                self.login_btn.setText('Signing in…')
                self.login_btn.setDisabled(True)
                self.trial_btn.setDisabled(True)
            elif starting_trial:
                self.trial_btn.setText('Starting…')
                self.trial_btn.setDisabled(True)
                self.login_btn.setDisabled(True)
            else:
                self.login_btn.setText('Sign In')
                self.trial_btn.setText('Start Trial')
                self.login_btn.setDisabled(False)
                self.trial_btn.setDisabled(False)
        except Exception:
            pass

    def _authenticate(self):
        username = self.username_entry.text().strip()
        password = self.password_entry.text().strip()
        if not username or not password:
            self._show_error('Enter both username and password')
            return
        api = _get_api_base()
        self._set_loading(signing_in=True)
        try:
            headers = {'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json'}
            payload = {'username': username, 'password': password}
            res = requests.post(f"{api}/api/authenticate", data=payload, headers=headers, timeout=8)
            data = {}
            try:
                data = res.json()
            except Exception:
                data = {}
            if res.status_code == 200 and data.get('status') == 'success':
                AppState.username = username
                AppState.is_running = True
                self.error_label.hide()
                if hasattr(self.parent, 'on_login_success'):
                    self.parent.on_login_success(username, password)
            else:
                message = data.get('message') if isinstance(data, dict) else None
                self._show_error(message or 'Invalid credentials or expired subscription')
        except requests.RequestException:
            self._show_error('Network error. Please try again.')
        except Exception:
            self._show_error('Unexpected error. Please try again.')
        finally:
            self._set_loading(signing_in=False)

    def _start_trial(self):
        api = _get_api_base()
        hwid = _get_hwid()
        self._set_loading(starting_trial=True)
        try:
            headers = {'Accept': 'application/json'}
            res = requests.post(f"{api}/api/trial/start", json={'hwid': hwid}, headers=headers, timeout=8)
            data = {}
            try:
                data = res.json()
            except Exception:
                data = {}
            if res.status_code == 200 and data.get('status') == 'success':
                AppState.username = f"trial:{hwid[:6]}"
                AppState.is_running = True
                self.error_label.hide()
                if hasattr(self.parent, 'on_login_success'):
                    self.parent.on_login_success(AppState.username, '')
            elif res.status_code == 429:
                self._show_error('Trial not available for this device')
            else:
                message = data.get('message') if isinstance(data, dict) else None
                self._show_error(message or 'Trial unavailable for this device')
        except requests.RequestException:
            self._show_error('Network error. Please try again.')
        except Exception:
            self._show_error('Unexpected error. Please try again.')
        finally:
            self._set_loading(starting_trial=False)

    def _show_error(self, msg: str):
        self.error_label.setText(msg)
        self.error_label.show()

    def _close_window(self):
        try:
            self.window().close()
        except Exception:
            pass