import matplotlib.pyplot as plt
import matplotlib
matplotlib.rcParams['font.family'] = 'DejaVu Sans'

refeicoes = ['Café da Manhã', 'Almoço', 'Lanche', 'Jantar']
calorias = [777, 1879, 384, 730]
proteinas = [7, 49, 2, 26]
carbs = [140, 236, 72, 117]
gorduras = [23, 41, 6, 29]

fig, axes = plt.subplots(2, 2, figsize=(14, 10))
fig.suptitle('Análise Nutricional — 06/05/2026', fontsize=16, fontweight='bold')

# 1. Calorias por refeição
colors_cal = ['#E74C3C', '#3498DB', '#F1C40F', '#2ECC71']
ax1 = axes[0, 0]
bars = ax1.bar(refeicoes, calorias, color=colors_cal, edgecolor='black')
ax1.set_ylabel('kcal')
ax1.set_title('Calorias por Refeição')
ax1.set_ylim(0, max(calorias) * 1.2)
for bar, val in zip(bars, calorias):
    ax1.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 30, f'{val}', ha='center', fontsize=11, fontweight='bold')
ax1.axhline(y=2000, color='red', linestyle='--', linewidth=1.5, label='Meta diária (~2000 kcal)')
ax1.legend(fontsize=9)

# 2. Distribuição de macros (pizza)
ax2 = axes[0, 1]
total_p = sum(proteinas)
total_c = sum(carbs)
total_g = sum(gorduras)
labels = ['Proteínas', 'Carboidratos', 'Gorduras']
sizes = [total_p, total_c, total_g]
colors_macro = ['#9B59B6', '#E67E22', '#1ABC9C']
wedges, texts, autotexts = ax2.pie(sizes, labels=labels, autopct='%1.1f%%', colors=colors_macro, startangle=90, explode=(0.02, 0.02, 0.02))
ax2.set_title(f'Distribuição de Macros\n(Total: {total_p + total_c + total_g} g)')
for autotext in autotexts:
    autotext.set_fontsize(11)
    autotext.set_fontweight('bold')

# 3. Macros por refeição (barras empilhadas)
ax3 = axes[1, 0]
x = range(len(refeicoes))
width = 0.5
p1 = ax3.bar(x, proteinas, width, label='Proteínas', color='#9B59B6')
p2 = ax3.bar(x, carbs, width, bottom=proteinas, label='Carboidratos', color='#E67E22')
p3 = ax3.bar(x, gorduras, width, bottom=[p + c for p, c in zip(proteinas, carbs)], label='Gorduras', color='#1ABC9C')
ax3.set_xticks(x)
ax3.set_xticklabels(refeicoes, rotation=15, ha='right')
ax3.set_ylabel('Gramas')
ax3.set_title('Macros por Refeição (g)')
ax3.legend(loc='upper right')

# 4. Comparativo com meta recomendada
ax4 = axes[1, 1]
categorias = ['Calorias\n(kcal)', 'Proteínas\n(g)', 'Carbs\n(g)', 'Gorduras\n(g)']
valores_reais = [sum(calorias), sum(proteinas), sum(carbs), sum(gorduras)]
valores_meta = [2000, 100, 250, 67]  # meta aproximada
colors_comp = ['#E74C3C', '#3498DB']
x = range(len(categorias))
width = 0.35
bars1 = ax4.bar([i - width/2 for i in x], valores_reais, width, label='Consumido', color='#E74C3C')
bars2 = ax4.bar([i + width/2 for i in x], valores_meta, width, label='Meta recomendada', color='#3498DB')
ax4.set_xticks(x)
ax4.set_xticklabels(categorias)
ax4.set_title('Consumido vs. Meta Recomendada')
ax4.legend()
for bar in bars1:
    ax4.text(bar.get_x() + bar.get_width()/2, bar.get_height() + max(valores_reais)*0.02, f'{int(bar.get_height())}', ha='center', fontsize=9)
for bar in bars2:
    ax4.text(bar.get_x() + bar.get_width()/2, bar.get_height() + max(valores_reais)*0.02, f'{int(bar.get_height())}', ha='center', fontsize=9)

plt.tight_layout(rect=[0, 0.03, 1, 0.95])
plt.savefig('/home/workspace/Refeicoes/grafico_2026-05-06.png', dpi=150, bbox_inches='tight')
print('Gráfico salvo em: /home/workspace/Refeicoes/grafico_2026-05-06.png')
