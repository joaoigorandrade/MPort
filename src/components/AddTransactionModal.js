import { useState, useEffect } from 'react';
import Modal from './Modal';

const AddTransactionModal = ({ isOpen, onClose, onAdd, holdings, currentPrices = {}, preselectedHoldingId = null }) => {
  const [holdingId, setHoldingId] = useState('');
  const [type, setType] = useState('buy');
  const [amount, setAmount] = useState('');
  const [price, setPrice] = useState('');
  const [fee, setFee] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setHoldingId(preselectedHoldingId || (holdings.length > 0 ? holdings[0].id : ''));
      setType('buy');
      setAmount('');
      setPrice('');
      setFee('');
      setDate(new Date().toISOString().split('T')[0]);
      setNotes('');
      setError('');
    }
  }, [isOpen, holdings, preselectedHoldingId]);

  // Auto-fill current price when holding is selected
  useEffect(() => {
    if (holdingId) {
      const holding = holdings.find(h => h.id === holdingId);
      if (holding && currentPrices[holding.symbol]) {
        setPrice(currentPrices[holding.symbol].toString());
      }
    }
  }, [holdingId, holdings, currentPrices]);

  const selectedHolding = holdings.find(h => h.id === holdingId);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!holdingId) {
      setError('Please select an asset');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (!price || parseFloat(price) <= 0) {
      setError('Please enter a valid price');
      return;
    }

    // For sells, check if user has enough
    if (type === 'sell' && selectedHolding) {
      if (parseFloat(amount) > selectedHolding.amount) {
        setError(`You only have ${selectedHolding.amount} ${selectedHolding.symbol} to sell`);
        return;
      }
    }

    onAdd({
      holdingId,
      type,
      amount: parseFloat(amount),
      price: parseFloat(price),
      fee: parseFloat(fee) || 0,
      date,
      notes: notes.trim(),
    });

    onClose();
  };

  const totalValue = (parseFloat(amount) || 0) * (parseFloat(price) || 0);
  const totalWithFee = type === 'buy' 
    ? totalValue + (parseFloat(fee) || 0)
    : totalValue - (parseFloat(fee) || 0);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Record ${type === 'buy' ? 'Buy' : 'Sell'} Transaction`} size="medium">
      <form onSubmit={handleSubmit} className="modal-form">
        <div className="form-row">
          <div className="form-group flex-1">
            <label htmlFor="holding">Asset</label>
            <select
              id="holding"
              value={holdingId}
              onChange={(e) => setHoldingId(e.target.value)}
            >
              {holdings.length === 0 && (
                <option value="">No assets - add one first</option>
              )}
              {holdings.map(holding => (
                <option key={holding.id} value={holding.id}>
                  {holding.symbol} - {holding.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="transaction-type-selector">
          <button
            type="button"
            className={`type-btn ${type === 'buy' ? 'active buy' : ''}`}
            onClick={() => setType('buy')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
            Buy
          </button>
          <button
            type="button"
            className={`type-btn ${type === 'sell' ? 'active sell' : ''}`}
            onClick={() => setType('sell')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12l7 7 7-7" />
            </svg>
            Sell
          </button>
        </div>

        {selectedHolding && (
          <div className="holding-info-banner">
            <span>Current holdings:</span>
            <strong>{selectedHolding.amount.toFixed(6)} {selectedHolding.symbol}</strong>
          </div>
        )}

        <div className="form-row">
          <div className="form-group flex-1">
            <label htmlFor="amount">Amount</label>
            <input
              type="number"
              id="amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              step="any"
              min="0"
            />
          </div>
          <div className="form-group flex-1">
            <label htmlFor="price">Price per unit (USD)</label>
            <input
              type="number"
              id="price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
              step="any"
              min="0"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group flex-1">
            <label htmlFor="fee">Fee (USD)</label>
            <input
              type="number"
              id="fee"
              value={fee}
              onChange={(e) => setFee(e.target.value)}
              placeholder="0.00"
              step="any"
              min="0"
            />
          </div>
          <div className="form-group flex-1">
            <label htmlFor="date">Date</label>
            <input
              type="date"
              id="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="notes">Notes (optional)</label>
          <input
            type="text"
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g., DCA, market dip, etc."
          />
        </div>

        {(amount && price) && (
          <div className="transaction-summary">
            <div className="summary-row">
              <span>Subtotal</span>
              <span>${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            {fee && (
              <div className="summary-row">
                <span>Fee</span>
                <span>{type === 'buy' ? '+' : '-'}${parseFloat(fee).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            )}
            <div className="summary-row total">
              <span>Total {type === 'buy' ? 'Cost' : 'Proceeds'}</span>
              <span className={type === 'buy' ? 'negative' : 'positive'}>
                ${Math.abs(totalWithFee).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        )}

        {error && <div className="form-error">{error}</div>}

        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button 
            type="submit" 
            className={`btn ${type === 'buy' ? 'btn-buy' : 'btn-sell'}`}
            disabled={holdings.length === 0}
          >
            Record {type === 'buy' ? 'Buy' : 'Sell'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AddTransactionModal;
