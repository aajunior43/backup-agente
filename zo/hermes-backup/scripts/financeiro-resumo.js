const fs = require('fs');
const DATA_FILE = '/home/administrator/obsidian/vaults/MeuCofre/EVA/dados/financeiro/financeiro-aleksandro.json';

const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
const mes = '2026-05';
const txns = data.transactions.filter(t => t.date.startsWith(mes));
const income = txns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
const expense = txns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

console.log('\n📊 RESUMO — ' + mes + '\n');
console.log('💚 Receitas:  R$ ' + income.toFixed(2).replace('.', ','));
console.log('🔴 Despesas:  R$ ' + expense.toFixed(2).replace('.', ','));
console.log('💰 Saldo:      R$ ' + (income - expense).toFixed(2).replace('.', ','));

console.log('\n📋 ' + txns.length + ' transacoes:');
for (const t of txns.sort((a, b) => b.date.localeCompare(a.date))) {
    const icon = t.type === 'income' ? '📥' : '📤';
    console.log('  ' + icon + ' ' + t.date + ' | R$ ' + t.amount.toFixed(2).replace('.', ',') + ' | ' + t.category + (t.recurrent ? ' ♻️' : ''));
    console.log('     ' + t.description.substring(0, 70));
}
