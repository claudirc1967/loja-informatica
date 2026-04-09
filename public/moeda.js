/**
 * Formatação monetária pt-BR (ex.: R$ 1.900,00).
 */
function formatarMoedaBRL(valor) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(Number(valor));
}

/** Apenas o valor com vírgula decimal e milhar com ponto (ex.: 1.900,00). */
function formatarValorBR(valor) {
    return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(Number(valor));
}
