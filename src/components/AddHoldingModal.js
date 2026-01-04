import { useState } from 'react';
import Modal from './Modal';
import { POPULAR_CRYPTOS, getCryptoColor } from '../services/priceService';

const AddHoldingModal = ({ isOpen, onClose, onAdd, existingSymbols = [] }) => {
  const [symbol, setSymbol] = useState('');
  const [name, setName] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [error, setError] = useState('');

  const filteredCryptos = POPULAR_CRYPTOS.filter(
    crypto => 
      !existingSymbols.includes(crypto.symbol) &&
      (crypto.symbol.toLowerCase().includes(symbol.toLowerCase()) ||
       crypto.name.toLowerCase().includes(symbol.toLowerCase()))
  );

  const handleSelectCrypto = (crypto) => {
    setSymbol(crypto.symbol);
    setName(crypto.name);
    setShowSuggestions(false);
    setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!symbol.trim()) {
      setError('Please enter a symbol');
      return;
    }

    if (existingSymbols.includes(symbol.toUpperCase())) {
      setError('This asset is already in your portfolio');
      return;
    }

    const finalName = name.trim() || symbol.toUpperCase();
    const color = getCryptoColor(symbol);

    onAdd({
      symbol: symbol.toUpperCase(),
      name: finalName,
      type: 'crypto',
      amount: 0,
      costBasis: 0,
      color,
    });

    // Reset form
    setSymbol('');
    setName('');
    setError('');
    onClose();
  };

  const handleClose = () => {
    setSymbol('');
    setName('');
    setError('');
    setShowSuggestions(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add New Asset" size="medium">
      <form onSubmit={handleSubmit} className="modal-form">
        <div className="form-group">
          <label htmlFor="symbol">Symbol</label>
          <div className="input-with-suggestions">
            <input
              type="text"
              id="symbol"
              value={symbol}
              onChange={(e) => {
                setSymbol(e.target.value);
                setShowSuggestions(true);
                setError('');
              }}
              onFocus={() => setShowSuggestions(true)}
              placeholder="e.g., BTC, ETH, SOL"
              autoComplete="off"
            />
            {showSuggestions && symbol && filteredCryptos.length > 0 && (
              <div className="suggestions-dropdown">
                {filteredCryptos.slice(0, 6).map(crypto => (
                  <button
                    key={crypto.symbol}
                    type="button"
                    className="suggestion-item"
                    onClick={() => handleSelectCrypto(crypto)}
                  >
                    <span 
                      className="suggestion-color" 
                      style={{ background: crypto.color }}
                    />
                    <span className="suggestion-symbol">{crypto.symbol}</span>
                    <span className="suggestion-name">{crypto.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <span className="form-hint">Search for popular cryptocurrencies or enter a custom symbol</span>
        </div>

        <div className="form-group">
          <label htmlFor="name">Name (optional)</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Bitcoin"
          />
          <span className="form-hint">Display name for this asset</span>
        </div>

        {error && <div className="form-error">{error}</div>}

        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={handleClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            Add Asset
          </button>
        </div>

        <div className="quick-add-section">
          <span className="quick-add-label">Quick add:</span>
          <div className="quick-add-grid">
            {POPULAR_CRYPTOS.slice(0, 8)
              .filter(c => !existingSymbols.includes(c.symbol))
              .map(crypto => (
                <button
                  key={crypto.symbol}
                  type="button"
                  className="quick-add-chip"
                  onClick={() => handleSelectCrypto(crypto)}
                  style={{ '--chip-color': crypto.color }}
                >
                  {crypto.symbol}
                </button>
              ))}
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default AddHoldingModal;
