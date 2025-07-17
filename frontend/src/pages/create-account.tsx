import React, { useEffect, useState } from 'react';
import './create-account.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const getPhoneNumberFromQuery = () => {
  const params = new URLSearchParams(window.location.search);
  return params.get('wa') || '';
};
const getCodeFromQuery = () => {
  const params = new URLSearchParams(window.location.search);
  return params.get('code') || '';
};

const WHATSAPP_OFFICIAL_NUMBER = '+2347081643714';
const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_OFFICIAL_NUMBER.replace('+', '')}`;

const CreateAccount: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState(getPhoneNumberFromQuery());
  const [userType, setUserType] = useState<'customer' | 'seller'>('customer');
  const [storeName, setStoreName] = useState('');
  const [storeDescription, setStoreDescription] = useState('');
  const [storeAddress, setStoreAddress] = useState('');
  const [storeCategories, setStoreCategories] = useState<string[]>([]);
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [expired, setExpired] = useState(false);
  const [validating, setValidating] = useState(false);
  const [csrfToken, setCsrfToken] = useState<string | null>(null);

  const code = getCodeFromQuery();

  useEffect(() => {
    fetch(`${API_BASE}/api/users/all-categories`)
      .then(res => res.json())
      .then(data => setAllCategories(data.categories || []));
  }, []);

  useEffect(() => {
    if (code) {
      setValidating(true);
      fetch(`${API_BASE}/api/shorten/validate/${code}`)
        .then(async res => {
          if (res.status === 410 || res.status === 404) {
            setExpired(true);
          }
          setValidating(false);
        })
        .catch(() => {
          setExpired(true);
          setValidating(false);
        });
    }
  }, [code]);

  useEffect(() => {
    // Fetch CSRF token on mount
    fetch(`${API_BASE}/api/users`, {
      method: 'GET',
      credentials: 'include',
    })
      .then(res => {
        // Try to get token from header first
        const token = res.headers.get('x-csrf-token');
        if (token) {
          setCsrfToken(token);
          return;
        }
        // Fallback: try to get from body if backend sends it there
        return res.json().then(data => {
          if (data && data.csrfToken) setCsrfToken(data.csrfToken);
        });
      })
      .catch(() => setCsrfToken(null));
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImage(file);
    }
  };

  const handleCategoryChange = (cat: string) => {
    setStoreCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);
    setExpired(false);
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('email', email);
      formData.append('phoneNumber', phoneNumber);
      formData.append('userType', userType);
      if (userType === 'seller') {
        formData.append('storeName', storeName);
        formData.append('storeDescription', storeDescription);
        formData.append('storeAddress', storeAddress);
        storeCategories.forEach(cat => formData.append('storeCategories[]', cat));
        if (profileImage) formData.append('profileImage', profileImage);
      }
      const res = await fetch(`${API_BASE}/api/users`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
        headers: csrfToken ? { 'X-CSRF-Token': csrfToken } : undefined,
      });
      if (res.status === 410) {
        setExpired(true);
        return;
      }
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create account');
      }
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-account-container">
      <form onSubmit={handleSubmit} className="create-account-form">
        <h2 className="create-account-title">Create Your Account</h2>
        {validating ? (
          <div className="validating-message">Validating link...</div>
        ) : expired ? (
          <div className="expired-container">
            <div className="expired-icon">⏰</div>
            <div className="expired-title">This link has expired.</div>
            <div className="expired-message">Please request a new account creation link from CommerceBridge support.</div>
            <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className="whatsapp-button">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="white" viewBox="0 0 24 24" className="whatsapp-icon"><path d="M12 2C6.477 2 2 6.477 2 12c0 1.989.583 3.838 1.588 5.393L2 22l4.755-1.561A9.953 9.953 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18c-1.64 0-3.17-.497-4.45-1.35l-.318-.207-2.825.928.93-2.74-.207-.318A7.963 7.963 0 0 1 4 12c0-4.411 3.589-8 8-8s8 3.589 8 8-3.589 8-8 8zm4.406-5.294c-.242-.121-1.434-.707-1.655-.788-.222-.081-.384-.121-.546.121-.162.242-.626.788-.768.95-.141.162-.283.182-.525.061-.242-.121-1.022-.377-1.946-1.202-.72-.642-1.207-1.433-1.35-1.675-.141-.242-.015-.373.106-.494.109-.108.242-.283.363-.424.121-.141.162-.242.242-.404.081-.162.04-.303-.02-.424-.061-.121-.546-1.318-.748-1.803-.197-.474-.398-.41-.546-.418l-.465-.008c-.162 0-.424.061-.646.303s-.848.828-.848 2.018c0 1.19.868 2.341.988 2.502.121.162 1.71 2.613 4.15 3.562.581.2 1.033.319 1.385.408.582.148 1.112.127 1.53.077.467-.056 1.434-.586 1.637-1.152.202-.566.202-1.051.142-1.152-.061-.101-.222-.162-.465-.283z"/></svg>
              Contact WhatsApp Support
            </a>
          </div>
        ) : loading ? (
          <div className="loading-container">
            <div className="spinner" />
            <div className="loading-text">Creating your account...</div>
          </div>
        ) : success ? (
          <div className="success-container">
            <div className="success-icon">✅</div>
            <div className="success-title">Account created!</div>
            <div className="success-message">You can now continue chatting on WhatsApp.</div>
            <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className="whatsapp-button">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="white" viewBox="0 0 24 24" className="whatsapp-icon"><path d="M12 2C6.477 2 2 6.477 2 12c0 1.989.583 3.838 1.588 5.393L2 22l4.755-1.561A9.953 9.953 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18c-1.64 0-3.17-.497-4.45-1.35l-.318-.207-2.825.928.93-2.74-.207-.318A7.963 7.963 0 0 1 4 12c0-4.411 3.589-8 8-8s8 3.589 8 8-3.589 8-8 8zm4.406-5.294c-.242-.121-1.434-.707-1.655-.788-.222-.081-.384-.121-.546.121-.162.242-.626.788-.768.95-.141.162-.283.182-.525.061-.242-.121-1.022-.377-1.946-1.202-.72-.642-1.207-1.433-1.35-1.675-.141-.242-.015-.373.106-.494.109-.108.242-.283.363-.424.121-.141.162-.242.242-.404.081-.162.04-.303-.02-.424-.061-.121-.546-1.318-.748-1.803-.197-.474-.398-.41-.546-.418l-.465-.008c-.162 0-.424.061-.646.303s-.848.828-.848 2.018c0 1.19.868 2.341.988 2.502.121.162 1.71 2.613 4.15 3.562.581.2 1.033.319 1.385.408.582.148 1.112.127 1.53.077.467-.056 1.434-.586 1.637-1.152.202-.566.202-1.051.142-1.152-.061-.101-.222-.162-.465-.283z"/></svg>
              Continue on WhatsApp
            </a>
          </div>
        ) : (
          <>
            <div className="form-field">
              <label>Name<br />
                <input type="text" value={name} onChange={e => setName(e.target.value)} required className="form-input" />
              </label>
            </div>
            <div className="form-field">
              <label>Email<br />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="form-input" />
              </label>
            </div>
            <div className="form-field">
              <label>WhatsApp Number<br />
                <input type="text" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} required className="form-input" readOnly={!!getPhoneNumberFromQuery()} />
              </label>
            </div>
            <div className="form-field">
              <label>User Type<br />
                <select value={userType} onChange={e => setUserType(e.target.value as 'customer' | 'seller')} className="form-input">
                  <option value="customer">Customer</option>
                  <option value="seller">Seller</option>
                </select>
              </label>
            </div>
            {userType === 'seller' && (
              <>
                <div className="form-field">
                  <label>Store Name<br />
                    <input type="text" value={storeName} onChange={e => setStoreName(e.target.value)} required={userType === 'seller'} className="form-input" />
                  </label>
                </div>
                <div className="form-field">
                  <label>Store Description<br />
                    <textarea value={storeDescription} onChange={e => setStoreDescription(e.target.value)} className="form-input" />
                  </label>
                </div>
                <div className="form-field">
                  <label>Store Address<br />
                    <input type="text" value={storeAddress} onChange={e => setStoreAddress(e.target.value)} className="form-input" />
                  </label>
                </div>
                <div className="form-field">
                  <label>Store Categories<br />
                    <div className="categories-container">
                      {allCategories.map(cat => (
                        <label key={cat} className={`category-label ${storeCategories.includes(cat) ? 'selected' : ''}`}>
                          <input type="checkbox" checked={storeCategories.includes(cat)} onChange={() => handleCategoryChange(cat)} className="category-checkbox" />
                          {cat}
                        </label>
                      ))}
                    </div>
                  </label>
                </div>
                <div className="form-field">
                  <label>Profile Image<br />
                    <input type="file" accept="image/*" onChange={handleImageChange} />
                  </label>
                  {profileImage && <span className="file-name">{profileImage.name}</span>}
                </div>
              </>
            )}
            <button type="submit" disabled={loading} className="submit-button">
              Create Account
            </button>
            {error && <div className="error-message">{error}</div>}
          </>
        )}
      </form>
    </div>
  );
};

export default CreateAccount; 