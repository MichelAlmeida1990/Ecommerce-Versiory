import React, { useState, useEffect } from 'react';
import { Coupon } from '../types';
import { addDoc, collection, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../services/firebase';

// Ícones SVG Inline para substituir react-icons
const IconPlus = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
    </svg>
);

const IconEdit = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
);

const IconTrash = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

const IconSave = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
    </svg>
);

const IconTimes = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const CouponManagement: React.FC = () => {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [newCoupon, setNewCoupon] = useState<Partial<Coupon>>({ tipo: 'fixo', valor: 0, ativo: true });
    const [editingCouponId, setEditingCouponId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCoupons();
    }, []);

    const fetchCoupons = async () => {
        setLoading(true);
        try {
            const querySnapshot = await getDocs(collection(db, 'coupons'));
            const fetchedCoupons: Coupon[] = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Coupon[];
            setCoupons(fetchedCoupons);
        } catch (error) {
            console.error("Error fetching coupons:", error);
            window.alert("Erro ao carregar cupons.");
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        let val: any = value;
        if (name === 'valor' || name === 'valorMinimo' || name === 'usoMaximo') {
            val = value === '' ? 0 : parseFloat(value);
        }
        setNewCoupon(prev => ({ ...prev, [name]: val }));
    };

    const handleAddCoupon = async () => {
        if (!newCoupon.codigo || !newCoupon.valor) {
            window.alert("Código e valor são obrigatórios.");
            return;
        }
        try {
            await addDoc(collection(db, 'coupons'), {
                ...newCoupon,
                codigo: newCoupon.codigo.toUpperCase(),
                usosRealizados: 0,
                dataInicio: new Date().toISOString(),
            });
            window.alert("Cupom adicionado com sucesso!");
            setNewCoupon({ tipo: 'fixo', valor: 0, ativo: true });
            fetchCoupons();
        } catch (error) {
            console.error("Error adding coupon:", error);
            window.alert("Erro ao adicionar cupom.");
        }
    };

    const handleEditCoupon = (coupon: Coupon) => {
        setEditingCouponId(coupon.id);
        setNewCoupon(coupon);
    };

    const handleUpdateCoupon = async () => {
        if (!editingCouponId || !newCoupon.codigo || !newCoupon.valor) {
            window.alert("Código e valor são obrigatórios.");
            return;
        }
        try {
            const couponRef = doc(db, 'coupons', editingCouponId);
            await updateDoc(couponRef, {
                ...newCoupon,
                codigo: newCoupon.codigo.toUpperCase(),
            });
            window.alert("Cupom atualizado com sucesso!");
            setEditingCouponId(null);
            setNewCoupon({ tipo: 'fixo', valor: 0, ativo: true });
            fetchCoupons();
        } catch (error) {
            console.error("Error updating coupon:", error);
            window.alert("Erro ao atualizar cupom.");
        }
    };

    const handleDeleteCoupon = async (id: string) => {
        if (window.confirm("Tem certeza que deseja excluir este cupom?")) {
            try {
                await deleteDoc(doc(db, 'coupons', id));
                window.alert("Cupom excluído com sucesso!");
                fetchCoupons();
            } catch (error) {
                console.error("Error deleting coupon:", error);
                window.alert("Erro ao excluir cupom.");
            }
        }
    };

    const handleCancelEdit = () => {
        setEditingCouponId(null);
        setNewCoupon({ tipo: 'fixo', valor: 0, ativo: true });
    };

    if (loading) {
        return <div className="text-center py-4 text-white">Carregando cupons...</div>;
    }

    return (
        <div className="p-4 bg-slate-800/40 backdrop-blur-md rounded-xl border border-slate-700/50">
            <h2 className="text-2xl font-black mb-4 text-white">Gerenciamento de Cupons</h2>

            <div className="mb-6 p-4 border border-white/10 rounded-xl bg-white/5">
                <h3 className="text-xl font-bold mb-3 text-white">{editingCouponId ? 'Editar Cupom' : 'Adicionar Novo Cupom'}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="codigo" className="block text-sm font-bold text-slate-300">Código do Cupom</label>
                        <input type="text" id="codigo" name="codigo" value={newCoupon.codigo || ''} onChange={handleInputChange} className="mt-1 block w-full bg-slate-900/50 border border-white/20 rounded-xl text-white shadow-sm p-2 outline-none focus:ring-2 focus:ring-versiory-coral" placeholder="EX: VERSIORY10" />
                    </div>
                    <div>
                        <label htmlFor="tipo" className="block text-sm font-bold text-slate-300">Tipo de Desconto</label>
                        <select id="tipo" name="tipo" value={newCoupon.tipo || 'fixo'} onChange={handleInputChange} className="mt-1 block w-full bg-slate-900/50 border border-white/20 rounded-xl text-white shadow-sm p-2 outline-none focus:ring-2 focus:ring-versiory-coral">
                            <option value="fixo" className="bg-slate-800">Valor Fixo (R$)</option>
                            <option value="percentual" className="bg-slate-800">Percentual (%)</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="valor" className="block text-sm font-bold text-slate-300">Valor do Desconto</label>
                        <input type="number" id="valor" name="valor" value={newCoupon.valor || 0} onChange={handleInputChange} className="mt-1 block w-full bg-slate-900/50 border border-white/20 rounded-xl text-white shadow-sm p-2 outline-none focus:ring-2 focus:ring-versiory-coral" />
                    </div>
                    <div>
                        <label htmlFor="valorMinimo" className="block text-sm font-bold text-slate-300">Valor Mínimo do Pedido</label>
                        <input type="number" id="valorMinimo" name="valorMinimo" value={newCoupon.valorMinimo || ''} onChange={handleInputChange} className="mt-1 block w-full bg-slate-900/50 border border-white/20 rounded-xl text-white shadow-sm p-2 outline-none focus:ring-2 focus:ring-versiory-coral" />
                    </div>
                    <div>
                        <label htmlFor="usoMaximo" className="block text-sm font-bold text-slate-300">Limite de Usos</label>
                        <input type="number" id="usoMaximo" name="usoMaximo" value={newCoupon.usoMaximo || ''} onChange={handleInputChange} className="mt-1 block w-full bg-slate-900/50 border border-white/20 rounded-xl text-white shadow-sm p-2 outline-none focus:ring-2 focus:ring-versiory-coral" />
                    </div>
                    <div>
                        <label htmlFor="dataFim" className="block text-sm font-bold text-slate-300">Data de Expiração</label>
                        <input type="date" id="dataFim" name="dataFim" value={newCoupon.dataFim ? newCoupon.dataFim.split('T')[0] : ''} onChange={handleInputChange} className="mt-1 block w-full bg-slate-900/50 border border-white/20 rounded-xl text-white shadow-sm p-2 outline-none focus:ring-2 focus:ring-versiory-coral" />
                    </div>
                </div>
                <div className="mt-4 flex space-x-2">
                    {editingCouponId ? (
                        <>
                            <button onClick={handleUpdateCoupon} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-xl flex items-center transition-all shadow-lg hover:-translate-y-1">
                                <span className="mr-2"><IconSave /></span> Salvar Alterações
                            </button>
                            <button onClick={handleCancelEdit} className="bg-slate-600 hover:bg-slate-700 text-white font-bold py-2 px-4 rounded-xl flex items-center transition-all shadow-lg hover:-translate-y-1">
                                <span className="mr-2"><IconTimes /></span> Cancelar
                            </button>
                        </>
                    ) : (
                        <button onClick={handleAddCoupon} className="bg-versiory-coral hover:bg-[#ff8368] text-white font-black py-3 px-6 rounded-xl flex items-center transition-all shadow-lg hover:-translate-y-1 active:scale-95">
                            <span className="mr-2"><IconPlus /></span> Adicionar Cupom
                        </button>
                    )}
                </div>
            </div>

            <h3 className="text-xl font-bold mb-3 text-white">Cupons Existentes</h3>
            {coupons.length === 0 ? (
                <p className="text-slate-400">Nenhum cupom cadastrado.</p>
            ) : (
                <div className="overflow-x-auto rounded-xl border border-white/10">
                    <table className="min-w-full bg-slate-900/30">
                        <thead>
                            <tr className="bg-white/5 text-left text-xs font-black text-slate-400 uppercase tracking-widest">
                                <th className="py-3 px-4 border-b border-white/10">Código</th>
                                <th className="py-3 px-4 border-b border-white/10">Tipo</th>
                                <th className="py-3 px-4 border-b border-white/10">Valor</th>
                                <th className="py-3 px-4 border-b border-white/10">Mín. Pedido</th>
                                <th className="py-3 px-4 border-b border-white/10">Limite Usos</th>
                                <th className="py-3 px-4 border-b border-white/10">Usos</th>
                                <th className="py-3 px-4 border-b border-white/10">Expiração</th>
                                <th className="py-3 px-4 border-b border-white/10">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {coupons.map(coupon => (
                                <tr key={coupon.id} className="hover:bg-white/5 transition-colors">
                                    <td className="py-3 px-4 text-white font-bold">{coupon.codigo}</td>
                                    <td className="py-3 px-4 text-slate-300 text-sm">{coupon.tipo === 'fixo' ? 'Fixo (R$)' : 'Percentual (%)'}</td>
                                    <td className="py-3 px-4 text-slate-300 text-sm">{coupon.tipo === 'fixo' ? `R$ ${coupon.valor.toFixed(2)}` : `${coupon.valor}%`}</td>
                                    <td className="py-3 px-4 text-slate-300 text-sm">{coupon.valorMinimo ? `R$ ${coupon.valorMinimo.toFixed(2)}` : '-'}</td>
                                    <td className="py-3 px-4 text-slate-300 text-sm">{coupon.usoMaximo || '-'}</td>
                                    <td className="py-3 px-4 text-slate-300 text-sm">{coupon.usosRealizados || 0}</td>
                                    <td className="py-3 px-4 text-slate-300 text-sm">{coupon.dataFim ? new Date(coupon.dataFim).toLocaleDateString() : '-'}</td>
                                    <td className="py-3 px-4">
                                        <div className="flex space-x-3">
                                            <button onClick={() => handleEditCoupon(coupon)} className="text-blue-400 hover:text-blue-300 transition-colors" title="Editar">
                                                <IconEdit />
                                            </button>
                                            <button onClick={() => handleDeleteCoupon(coupon.id)} className="text-red-400 hover:text-red-300 transition-colors" title="Excluir">
                                                <IconTrash />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default CouponManagement;