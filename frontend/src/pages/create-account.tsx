import React, { useEffect, useState } from 'react';

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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9f9f9' }}>
      <form onSubmit={handleSubmit} style={{ background: '#fff', padding: 32, borderRadius: 12, boxShadow: '0 2px 16px rgba(0,0,0,0.08)', minWidth: 320, maxWidth: 480 }}>
        <h2 style={{ color: '#25d366', marginBottom: 24 }}>Create Your Account</h2>
        {validating ? (
          <div style={{ textAlign: 'center', margin: '32px 0', color: '#888' }}>Validating link...</div>
        ) : expired ? (
          <div style={{ textAlign: 'center', margin: '32px 0' }}>
            <div style={{ fontSize: 48, color: 'red', marginBottom: 16 }}>⏰</div>
            <div style={{ color: 'red', fontSize: 20, marginBottom: 16 }}>This link has expired.</div>
            <div style={{ marginBottom: 24 }}>Please request a new account creation link from CommerceBridge support.</div>
            <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', background: '#25d366', color: '#fff', padding: '12px 24px', borderRadius: 6, fontSize: '1.1em', textDecoration: 'none', fontWeight: 500, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="white" viewBox="0 0 24 24" style={{ marginRight: 8 }}><path d="M12 2C6.477 2 2 6.477 2 12c0 1.989.583 3.838 1.588 5.393L2 22l4.755-1.561A9.953 9.953 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18c-1.64 0-3.17-.497-4.45-1.35l-.318-.207-2.825.928.93-2.74-.207-.318A7.963 7.963 0 0 1 4 12c0-4.411 3.589-8 8-8s8 3.589 8 8-3.589 8-8 8zm4.406-5.294c-.242-.121-1.434-.707-1.655-.788-.222-.081-.384-.121-.546.121-.162.242-.626.788-.768.95-.141.162-.283.182-.525.061-.242-.121-1.022-.377-1.946-1.202-.72-.642-1.207-1.433-1.35-1.675-.141-.242-.015-.373.106-.494.109-.108.242-.283.363-.424.121-.141.162-.242.242-.404.081-.162.04-.303-.02-.424-.061-.121-.546-1.318-.748-1.803-.197-.474-.398-.41-.546-.418l-.465-.008c-.162 0-.424.061-.646.303s-.848.828-.848 2.018c0 1.19.868 2.341.988 2.502.121.162 1.71 2.613 4.15 3.562.581.2 1.033.319 1.385.408.582.148 1.112.127 1.53.077.467-.056 1.434-.586 1.637-1.152.202-.566.202-1.051.142-1.152-.061-.101-.222-.162-.465-.283z"/></svg>
              Contact WhatsApp Support
            </a>
          </div>
        ) : loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '32px 0' }}>
            <div className="spinner" style={{ width: 40, height: 40, border: '4px solid #eee', borderTop: '4px solid #25d366', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <div style={{ marginTop: 16, color: '#888' }}>Creating your account...</div>
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          </div>
        ) : success ? (
          <div style={{ textAlign: 'center', margin: '32px 0' }}>
            <div style={{ fontSize: 48, color: '#25d366', marginBottom: 16 }}>✅</div>
            <div style={{ color: '#25d366', fontSize: 20, marginBottom: 16 }}>Account created!</div>
            <div style={{ marginBottom: 24 }}>You can now continue chatting on WhatsApp.</div>
            <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', background: '#25d366', color: '#fff', padding: '12px 24px', borderRadius: 6, fontSize: '1.1em', textDecoration: 'none', fontWeight: 500, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="white" viewBox="0 0 24 24" style={{ marginRight: 8 }}><path d="M12 2C6.477 2 2 6.477 2 12c0 1.989.583 3.838 1.588 5.393L2 22l4.755-1.561A9.953 9.953 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18c-1.64 0-3.17-.497-4.45-1.35l-.318-.207-2.825.928.93-2.74-.207-.318A7.963 7.963 0 0 1 4 12c0-4.411 3.589-8 8-8s8 3.589 8 8-3.589 8-8 8zm4.406-5.294c-.242-.121-1.434-.707-1.655-.788-.222-.081-.384-.121-.546.121-.162.242-.626.788-.768.95-.141.162-.283.182-.525.061-.242-.121-1.022-.377-1.946-1.202-.72-.642-1.207-1.433-1.35-1.675-.141-.242-.015-.373.106-.494.109-.108.242-.283.363-.424.121-.141.162-.242.242-.404.081-.162.04-.303-.02-.424-.061-.121-.546-1.318-.748-1.803-.197-.474-.398-.41-.546-.418l-.465-.008c-.162 0-.424.061-.646.303s-.848.828-.848 2.018c0 1.19.868 2.341.988 2.502.121.162 1.71 2.613 4.15 3.562.581.2 1.033.319 1.385.408.582.148 1.112.127 1.53.077.467-.056 1.434-.586 1.637-1.152.202-.566.202-1.051.142-1.152-.061-.101-.222-.162-.465-.283z"/></svg>
              Continue on WhatsApp
            </a>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 16 }}>
              <label>Name<br />
                <input type="text" value={name} onChange={e => setName(e.target.value)} required style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc' }} />
              </label>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label>Email<br />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc' }} />
              </label>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label>WhatsApp Number<br />
                <input type="text" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} required style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc' }} readOnly={!!getPhoneNumberFromQuery()} />
              </label>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label>User Type<br />
                <select value={userType} onChange={e => setUserType(e.target.value as 'customer' | 'seller')} style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc' }}>
                  <option value="customer">Customer</option>
                  <option value="seller">Seller</option>
                </select>
              </label>
            </div>
            {userType === 'seller' && (
              <>
                <div style={{ marginBottom: 16 }}>
                  <label>Store Name<br />
                    <input type="text" value={storeName} onChange={e => setStoreName(e.target.value)} required={userType === 'seller'} style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc' }} />
                  </label>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label>Store Description<br />
                    <textarea value={storeDescription} onChange={e => setStoreDescription(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc' }} />
                  </label>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label>Store Address<br />
                    <input type="text" value={storeAddress} onChange={e => setStoreAddress(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc' }} />
                  </label>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label>Store Categories<br />
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                      {allCategories.map(cat => (
                        <label key={cat} style={{ display: 'flex', alignItems: 'center', gap: 4, background: storeCategories.includes(cat) ? '#25d366' : '#eee', color: storeCategories.includes(cat) ? '#fff' : '#333', borderRadius: 4, padding: '4px 8px', cursor: 'pointer' }}>
                          <input type="checkbox" checked={storeCategories.includes(cat)} onChange={() => handleCategoryChange(cat)} style={{ marginRight: 4 }} />
                          {cat}
                        </label>
                      ))}
                    </div>
                  </label>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label>Profile Image<br />
                    <input type="file" accept="image/*" onChange={handleImageChange} />
                  </label>
                  {profileImage && <span style={{ marginTop: 8, display: 'block' }}>{profileImage.name}</span>}
                </div>
              </>
            )}
            <button type="submit" disabled={loading} style={{ background: '#25d366', color: '#fff', border: 'none', padding: '12px 32px', borderRadius: 6, fontSize: '1.1em', cursor: 'pointer', width: '100%' }}>
              Create Account
            </button>
            {error && <div style={{ color: 'red', marginTop: 16 }}>{error}</div>}
          </>
        )}
      </form>
    </div>
  );
};

export default CreateAccount; 