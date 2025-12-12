
import React, { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { AlertCircle, Info, TrendingUp, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import FocusLock from 'react-focus-lock';
import { tradingService } from '../../services/tradingService';
import { useApp } from '../../context/AppContext';
import { FieldError } from '../Common/FieldError';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export const OrderForm = ({ symbol, currentPrice }: { symbol: string, currentPrice: number }) => {
  const { addToast } = useApp();
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [orderType, setOrderType] = useState<'limit' | 'market' | 'stop-limit'>('limit');
  const [price, setPrice] = useState<string>('');
  const [stopPrice, setStopPrice] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [total, setTotal] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableBalance, setAvailableBalance] = useState({ USDT: 0, [symbol]: 0 });
  const [errors, setErrors] = useState<{ field: string; message: string }[]>([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [selectedPercent, setSelectedPercent] = useState<number | null>(null);

  // Load balances
  useEffect(() => {
    const loadBalances = async () => {
      try {
        const usdtBalance = await tradingService.getAvailableBalance('USDT');
        const coinBalance = await tradingService.getAvailableBalance(symbol);
        setAvailableBalance({ USDT: usdtBalance, [symbol]: coinBalance });
      } catch (e) {
        console.error('Failed to load balances:', e);
      }
    };
    loadBalances();
    const interval = setInterval(loadBalances, 5000);
    return () => clearInterval(interval);
  }, [symbol]);

  // Auto-set price for limit orders
  useEffect(() => {
    if (orderType === 'limit' && !price && currentPrice) {
      setPrice(currentPrice.toFixed(2));
    }
    if (orderType === 'market') {
      setPrice('Market');
    }
  }, [currentPrice, orderType]);

  // Calculate total
  useEffect(() => {
    const p = orderType === 'market' ? currentPrice : parseFloat(price) || 0;
    const a = parseFloat(amount) || 0;
    if (p && a) {
      const totalValue = p * a;
      const fee = totalValue * 0.001; // 0.1% fee
      setTotal((totalValue + (side === 'buy' ? fee : 0)).toFixed(2));
    } else {
      setTotal('');
    }
  }, [price, amount, currentPrice, orderType, side]);

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: { field: string; message: string }[] = [];

    const amountVal = parseFloat(amount);
    if (!amountVal || amountVal <= 0) {
      newErrors.push({ field: 'amount', message: 'Amount must be greater than 0' });
    }

    if (orderType !== 'market') {
      const priceVal = parseFloat(price);
      if (!priceVal || priceVal <= 0) {
        newErrors.push({ field: 'price', message: 'Price must be greater than 0' });
      }
    }

    if (orderType === 'stop-limit') {
      const stopVal = parseFloat(stopPrice);
      if (!stopVal || stopVal <= 0) {
        newErrors.push({ field: 'stopPrice', message: 'Stop price is required' });
      }
    }

    // Check minimum order value (10 USDT)
    const totalVal = parseFloat(total);
    if (totalVal < 10) {
      newErrors.push({ field: 'total', message: 'Minimum order value is 10 USDT' });
    }

    // Check balance
    if (side === 'buy') {
      if (totalVal > availableBalance.USDT) {
        newErrors.push({ field: 'balance', message: 'Insufficient USDT balance' });
      }
    } else {
      if (amountVal > availableBalance[symbol]) {
        newErrors.push({ field: 'balance', message: `Insufficient ${symbol} balance` });
      }
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      addToast('Please fix the form errors', 'error');
      return;
    }

    setShowConfirmation(true);
  };

  const confirmOrder = async () => {
    setShowConfirmation(false);
    setIsSubmitting(true);

    try {
      const orderPrice = orderType === 'market' ? currentPrice : parseFloat(price);
      const orderAmount = parseFloat(amount);

      const order = await tradingService.placeOrder({
        symbol: `${symbol}/USDT`,
        side,
        type: orderType,
        price: orderPrice,
        amount: orderAmount,
        stopPrice: orderType === 'stop-limit' ? parseFloat(stopPrice) : undefined
      });

      addToast(
        `${orderType.toUpperCase()} order placed: ${side.toUpperCase()} ${orderAmount.toFixed(4)} ${symbol} @ ${orderType === 'market' ? 'MARKET' : orderPrice.toFixed(2)}`,
        'success'
      );

      // Reset form
      setAmount('');
      setTotal('');
      if (orderType === 'stop-limit') setStopPrice('');
      setErrors([]);

      // Reload balances
      const usdtBalance = await tradingService.getAvailableBalance('USDT');
      const coinBalance = await tradingService.getAvailableBalance(symbol);
      setAvailableBalance({ USDT: usdtBalance, [symbol]: coinBalance });

    } catch (error: any) {
      addToast(error.message || 'Failed to place order', 'error');
      console.error('Order error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePercentageClick = (pct: number) => {
    setSelectedPercent(pct);
    const priceVal = orderType === 'market' ? currentPrice : parseFloat(price) || currentPrice;
    
    if (side === 'buy') {
      const available = availableBalance.USDT;
      const maxBuy = (available * (pct / 100)) / priceVal;
      // Account for fees
      const adjustedAmount = maxBuy * 0.999; // 0.1% fee
      setAmount(adjustedAmount.toFixed(6));
    } else {
      const available = availableBalance[symbol];
      setAmount((available * (pct / 100)).toFixed(6));
    }
  };

  const getFieldError = (field: string) => errors.find(e => e.field === field)?.message;

  return (
    <>
      <div className="glass-card p-5 h-full flex flex-col overflow-y-auto custom-scrollbar">
        {/* Side Tabs */}
        <div className="flex bg-slate-950 p-1 rounded-xl mb-5 shrink-0">
          <button
            onClick={() => setSide('buy')}
            data-action="buy"
            className={cn(
              "flex-1 py-2.5 rounded-lg text-sm font-bold transition-all duration-200",
              "focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-950",
              side === 'buy' ? "bg-green-600 text-white shadow-lg shadow-green-900/20" : "text-slate-300 hover:text-white"
            )}
          >
            Buy
          </button>
          <button
            onClick={() => setSide('sell')}
            data-action="sell"
            className={cn(
              "flex-1 py-2.5 rounded-lg text-sm font-bold transition-all duration-200",
              "focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-950",
              side === 'sell' ? "bg-red-600 text-white shadow-lg shadow-red-900/20" : "text-slate-300 hover:text-white"
            )}
          >
            Sell
          </button>
        </div>

        {/* Order Type Tabs */}
        <div className="flex gap-6 text-sm font-medium text-slate-300 mb-5 px-1 shrink-0">
          <button 
            onClick={() => setOrderType('limit')}
            className={cn(
              "hover:text-white transition-colors relative rounded px-2 py-1",
              "focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-950",
              orderType === 'limit' && "text-purple-400"
            )}
          >
            Limit
            {orderType === 'limit' && <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-purple-500 rounded-full" />}
          </button>
          <button 
            onClick={() => { setOrderType('market'); setPrice('Market'); }}
            className={cn(
              "hover:text-white transition-colors relative rounded px-2 py-1",
              "focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-950",
              orderType === 'market' && "text-purple-400"
            )}
          >
            Market
            {orderType === 'market' && <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-purple-500 rounded-full" />}
          </button>
          <button 
            onClick={() => setOrderType('stop-limit')}
            className={cn(
              "hover:text-white transition-colors relative rounded px-2 py-1",
              "focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-950",
              orderType === 'stop-limit' && "text-purple-400"
            )}
          >
            Stop-Limit
            {orderType === 'stop-limit' && <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-purple-500 rounded-full" />}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 flex-1 flex flex-col">
          {/* Stop Price (for stop-limit orders) */}
          {orderType === 'stop-limit' && (
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">Stop Price (USDT)</label>
              <div className="relative">
                <input 
                  type="number" 
                  value={stopPrice}
                  onChange={e => setStopPrice(e.target.value)}
                  className={cn("input-glass w-full text-right font-mono", getFieldError('stopPrice') && "border-red-500")}
                  placeholder={currentPrice.toFixed(2)}
                  step="0.01"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">USDT</span>
              </div>
              {getFieldError('stopPrice') && <FieldError message={getFieldError('stopPrice')!} />}
            </div>
          )}

          {/* Price */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">
              Price (USDT) {orderType === 'market' && <span className="text-green-400">● MARKET</span>}
            </label>
            <div className="relative">
              <input 
                type={orderType === 'market' ? 'text' : 'number'}
                value={price}
                onChange={e => { if (orderType !== 'market') setPrice(e.target.value); }}
                disabled={orderType === 'market'}
                className={cn("input-glass w-full text-right font-mono", getFieldError('price') && "border-red-500")}
                placeholder={currentPrice.toFixed(2)}
                step="0.01"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">USDT</span>
            </div>
            {getFieldError('price') && <FieldError message={getFieldError('price')!} />}
          </div>

          {/* Amount */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">Amount ({symbol})</label>
            <div className="relative">
              <input 
                type="number" 
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className={cn("input-glass w-full text-right font-mono", getFieldError('amount') && "border-red-500")}
                placeholder="0.00"
                step="0.0001"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">{symbol}</span>
            </div>
            {getFieldError('amount') && <FieldError message={getFieldError('amount')!} />}
          </div>

          {/* Percentage Slider */}
          <div className="grid grid-cols-4 gap-2">
            {[25, 50, 75, 100].map(pct => (
              <button 
                key={pct} 
                type="button"
                onClick={() => handlePercentageClick(pct)}
                className={cn(
                  "py-2 rounded-lg text-xs font-bold transition-all border",
                  "focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-950",
                  selectedPercent === pct
                    ? "bg-purple-500/30 border-purple-500 text-purple-200 shadow-lg shadow-purple-500/20"
                    : "bg-white/5 border-white/5 hover:bg-purple-500/20 hover:border-purple-500/50 text-slate-300"
                )}
              >
                {pct}%
              </button>
            ))}
          </div>

          {/* Total */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-slate-300 font-bold uppercase tracking-wider flex items-center gap-1">
              Total (USDT)
              {total && <span className="text-xs text-slate-500 normal-case">(incl. 0.1% fee)</span>}
            </label>
            <input 
              type="text" 
              value={total}
              readOnly
              className={cn("bg-slate-900/50 border border-white/5 w-full rounded-xl px-4 py-2.5 text-right font-mono text-slate-300 outline-none", getFieldError('total') && "border-red-500")}
              placeholder="0.00"
            />
            {getFieldError('total') && <FieldError message={getFieldError('total')!} />}
          </div>

          <div className="flex-1 min-h-[10px]" />

          {/* Balance Display */}
          <div 
            className="bg-slate-900/50 rounded-lg p-3 border border-white/5"
            role="status"
            aria-live="polite"
            aria-label="Available balance"
          >
            <div className="flex justify-between text-xs mb-2">
              <span className="text-slate-300">Available:</span>
              <span className="text-white font-mono font-bold">
                {side === 'buy' 
                  ? `${availableBalance.USDT.toFixed(2)} USDT` 
                  : `${availableBalance[symbol].toFixed(6)} ${symbol}`
                }
              </span>
            </div>
            {getFieldError('balance') && <FieldError message={getFieldError('balance')!} />}
          </div>

          {/* Submit Button */}
          <button 
            type="submit"
            disabled={!amount || isSubmitting}
            className={cn(
              "w-full py-3.5 rounded-xl font-bold text-white shadow-lg transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
              "focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-950",
              side === 'buy' 
                ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 shadow-green-900/20" 
                : "bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 shadow-red-900/20"
            )}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full motion-safe:animate-spin" />
                Processing...
              </span>
            ) : (
              `${side === 'buy' ? 'Buy' : 'Sell'} ${symbol}`
            )}
          </button>
        </form>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmation && (
          <FocusLock>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="confirm-order-title"
              aria-describedby="confirm-order-description"
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
              onClick={() => setShowConfirmation(false)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setShowConfirmation(false);
                }
              }}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={e => e.stopPropagation()}
                className="glass-card p-6 max-w-md w-full border-2 border-purple-500/20"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 id="confirm-order-title" className="text-xl font-bold text-white">
                    Confirm Order
                  </h3>
                  <button
                    onClick={() => setShowConfirmation(false)}
                    aria-label="Close dialog"
                    className="p-2 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <X size={20} />
                  </button>
                </div>
                
                <div id="confirm-order-description" className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-300">Type:</span>
                    <span className="text-white font-bold uppercase">{orderType}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-300">Side:</span>
                    <span className={cn("font-bold uppercase", side === 'buy' ? 'text-green-400' : 'text-red-400')}>
                      {side}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-300">Amount:</span>
                    <span className="text-white font-mono">{amount} {symbol}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-300">Price:</span>
                    <span className="text-white font-mono">
                      {orderType === 'market' ? 'MARKET' : `${price} USDT`}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm border-t border-white/10 pt-3">
                    <span className="text-slate-300">Total:</span>
                    <span className="text-white font-mono font-bold">{total} USDT</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowConfirmation(false)}
                    className="flex-1 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-white font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmOrder}
                    className={cn(
                      "flex-1 py-2.5 rounded-lg font-bold text-white transition-all focus:outline-none focus:ring-2 focus:ring-purple-500",
                      side === 'buy'
                        ? "bg-green-600 hover:bg-green-500"
                        : "bg-red-600 hover:bg-red-500"
                    )}
                  >
                    Confirm
                  </button>
                </div>
              </motion.div>
            </motion.div>
          </FocusLock>
        )}
      </AnimatePresence>
    </>
  );
};
