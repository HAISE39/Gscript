// script.js
document.addEventListener('DOMContentLoaded', () => {
  const SYSTEM_PROMPT = `Mulai sekarang, Anda adalah VELLTOOLS. Aturan ketat:
1. Fokus sepenuhnya hanya pada script Game Guardian (Lua).
2. Jangan menanggapi pertanyaan, komentar, atau permintaan apapun selain pembuatan, optimasi, atau modifikasi script Game Guardian.
3. Semua pekerjaan yang dilakukan wajib 100% berhubungan dengan script Game Guardian.
4. Jangan mengirim placeholder, contoh umum, atau teks penjelasan.
5. Jangan menambahkan fitur atau modul yang tidak diminta.
6. Jangan menggabungkan dengan potongan script lain kecuali diperintahkan secara spesifik.
7. Hasil akhir wajib dikirim dalam blok kode Lua: \`\`\`lua\n-- kode hasil akhir di sini\n\`\`\`.
8. Tunggu instruksi saya untuk mulai membuat, mengoptimalkan, atau memodifikasi script.
9. Semua output harus langsung runnable di Game Guardian tanpa error.
Peran Anda adalah VELLTOOLS, asisten profesional untuk Game Guardian.`;

  // state
  let currentUser = null;
  let conversations = {};
  let currentChatId = null;

  // dom
  const loginModal = document.getElementById('loginModal');
  const signupModal = document.getElementById('signupModal');
  const showSignup = document.getElementById('showSignup');
  const showLogin = document.getElementById('showLogin');
  const loginBtn = document.getElementById('loginBtn');
  const signupBtn = document.getElementById('signupBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const usernameDisplay = document.getElementById('username-display');
  const usernameDisplaySide = document.getElementById('username-display-side');
  const userAvatar = document.getElementById('user-avatar');
  const chatBox = document.getElementById('chat-box');
  const userInput = document.getElementById('user-input');
  const sendBtn = document.getElementById('send-btn');
  const newProjectBtn = document.getElementById('new-project-btn');
  const historyList = document.getElementById('history-list');
  const typingIndicator = document.getElementById('typing-indicator');

  // auth
  function checkLoginState() {
    currentUser = localStorage.getItem('velltools_user');
    if (currentUser) {
      loginModal.style.display = 'none';
      signupModal.style.display = 'none';
      usernameDisplay.textContent = currentUser;
      usernameDisplaySide.textContent = currentUser;
      userAvatar.textContent = currentUser.charAt(0).toUpperCase();
      userInput.disabled = false;
      sendBtn.disabled = false;
      loadUserConversations();
      renderHistory();
      if (Object.keys(conversations).length === 0) createNewChat();
      else loadChat(Object.keys(conversations).sort().pop());
    } else {
      loginModal.style.display = 'flex';
      userInput.disabled = true;
      sendBtn.disabled = true;
    }
  }

  showSignup.onclick = () => { loginModal.style.display = 'none'; signupModal.style.display = 'flex'; };
  showLogin.onclick = () => { signupModal.style.display = 'none'; loginModal.style.display = 'flex'; };

  signupBtn.onclick = () => {
    const username = document.getElementById('signupUsername').value.trim();
    const password = document.getElementById('signupPassword').value.trim();
    if (!username || !password) return alert('Username and password cannot be empty.');
    if (localStorage.getItem('velltools_account_' + username)) return alert('Username already exists!');
    localStorage.setItem('velltools_account_' + username, password);
    alert('Account created — please login.');
    showLogin.onclick();
  };

  loginBtn.onclick = () => {
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    const stored = localStorage.getItem('velltools_account_' + username);
    if (stored && stored === password) {
      localStorage.setItem('velltools_user', username);
      checkLoginState();
    } else alert('Invalid username or password.');
  };

  logoutBtn.onclick = () => {
    localStorage.removeItem('velltools_user');
    currentUser = null;
    usernameDisplay.textContent = 'Guest';
    usernameDisplaySide.textContent = 'Guest';
    userAvatar.textContent = 'G';
    conversations = {};
    currentChatId = null;
    chatBox.innerHTML = '<div class="welcome-message"><h1>VELLTOOLS AI Assistant</h1></div>';
    historyList.innerHTML = '';
    checkLoginState();
  };

  // storage
  function loadUserConversations() {
    const data = localStorage.getItem('velltools_chats_' + currentUser);
    conversations = data ? JSON.parse(data) : {};
  }
  function saveConversations() {
    if (currentUser) localStorage.setItem('velltools_chats_' + currentUser, JSON.stringify(conversations));
  }

  function renderHistory() {
    historyList.innerHTML = '';
    Object.keys(conversations).sort().reverse().forEach(chatId => {
      const li = document.createElement('li');
      li.className = 'history-item';
      const firstUser = conversations[chatId].find(m => m.role === 'user');
      li.textContent = firstUser ? firstUser.content.substring(0, 25) + '...' : 'New Project';
      li.dataset.chatId = chatId;
      if (chatId === currentChatId) li.classList.add('active');
      li.onclick = () => { loadChat(chatId); renderHistory(); };
      historyList.appendChild(li);
    });
  }

  function createNewChat() {
    currentChatId = 'chat_' + Date.now();
    conversations[currentChatId] = [];
    chatBox.innerHTML = '';
    appendMessage('assistant', 'A new project has started. How can I assist you with your Game Guardian script?', false);
    saveConversations();
    renderHistory();
  }
  newProjectBtn.onclick = createNewChat;

  function loadChat(id) {
    currentChatId = id;
    chatBox.innerHTML = '';
    const hist = conversations[id] || [];
    hist.forEach(msg => appendMessage(msg.role, msg.content, false));
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  function appendMessage(role, content, save = true) {
    // remove welcome if present
    const w = document.querySelector('.welcome-message');
    if (w) w.remove();

    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', role === 'user' ? 'user-message' : 'ai-message');

    const contentDiv = document.createElement('div');
    contentDiv.classList.add('msg-content');

    // support code blocks for lua
    if (content.includes('```lua')) {
      // split and render code block with copy button
      const parts = content.split('```lua');
      const before = parts[0];
      const codePart = parts[1] ? parts[1].split('```')[0] : '';
      const after = parts[1] ? parts[1].split('```')[1] || '' : '';

      if (before.trim()) contentDiv.innerHTML += `<p>${escapeHtml(before)}</p>`;
      if (codePart) {
        const pre = document.createElement('pre');
        const codeEl = document.createElement('code');
        codeEl.className = 'lua';
        codeEl.textContent = codePart;
        pre.appendChild(codeEl);

        const copyBtn = document.createElement('button');
        copyBtn.className = 'copy-btn';
        copyBtn.textContent = 'Copy Code';
        copyBtn.onclick = () => {
          navigator.clipboard.writeText(codePart).then(()=>{
            copyBtn.textContent = 'Copied!';
            setTimeout(()=>copyBtn.textContent = 'Copy Code', 1500);
          });
        };
        pre.appendChild(copyBtn);
        contentDiv.appendChild(pre);
      }
      if (after.trim()) contentDiv.innerHTML += `<p>${escapeHtml(after)}</p>`;
    } else {
      contentDiv.innerHTML = nl2br(escapeHtml(content));
    }

    messageDiv.appendChild(contentDiv);
    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;

    if (save && currentChatId) {
      conversations[currentChatId].push({ role, content });
      saveConversations();
      renderHistory();
    }
  }

  function escapeHtml(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }
  function nl2br(str) {
    return str.replace(/\n/g, "<br>");
  }

  // send to our api/bytez
  async function getAiResponse() {
    const text = userInput.value.trim();
    if (!text) return;
    appendMessage('user', text);
    userInput.value = '';
    sendBtn.disabled = true;
    userInput.disabled = true;
    typingIndicator.style.display = 'block';

    const history = conversations[currentChatId] || [];

    // send messages array: keep roles + content
    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...history
    ];

    try {
      const resp = await fetch('/api/bytez', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, model: "Qwen/Qwen3-4B" })
      });

      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.error || JSON.stringify(data));

      // try multiple possible response shapes
      let aiText = null;
      if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
        aiText = data.choices[0].message.content;
      } else if (data.output && Array.isArray(data.output)) {
        // output array as returned by some providers
        aiText = data.output.map(o => (o.content?.[0]?.text || o.text || JSON.stringify(o))).join('\n');
      } else if (data.output && data.output.text) {
        aiText = data.output.text;
      } else if (typeof data === 'string') {
        aiText = data;
      } else {
        aiText = JSON.stringify(data);
      }

      appendMessage('assistant', aiText);
    } catch (err) {
      console.error('getAiResponse error', err);
      appendMessage('assistant', `Sorry, an error occurred: ${err.message}`);
    } finally {
      typingIndicator.style.display = 'none';
      sendBtn.disabled = false;
      userInput.disabled = false;
      userInput.focus();
    }
  }

  sendBtn.onclick = getAiResponse;
  userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      getAiResponse();
    }
  });

  // init
  checkLoginState();
});
