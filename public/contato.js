document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('contato-form');
    const feedback = document.getElementById('contato-feedback');

    form.addEventListener('submit', (event) => {
        event.preventDefault();

        const nome = form.nome.value.trim();
        const email = form.email.value.trim();
        const mensagem = form.mensagem.value.trim();

        if (!nome || !email || !mensagem) {
            feedback.textContent = 'Preencha todos os campos antes de enviar.';
            feedback.classList.remove('success');
            feedback.classList.add('error');
            return;
        }

        // Simulação de envio de mensagem
        feedback.textContent = 'Mensagem enviada com sucesso! Em breve nossa equipe entrará em contato.';
        feedback.classList.remove('error');
        feedback.classList.add('success');
        form.reset();
    });
});

