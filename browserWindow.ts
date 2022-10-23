window.addEventListener('DOMContentLoaded', async () => {
    const button = document.querySelector('#program'),
        logs = document.querySelector('#logs'),
        completionStatus = document.querySelector('#completionStatus'),
        bpVersion = document.querySelector('#bluePadVersion'),
        commitMessage = document.querySelector('#commitMessage'),
        commitSha = document.querySelector('#commitSha');

    const versions = await window.mainAPI.versions;

    bpVersion && (bpVersion.textContent = versions.bluePad);
    commitMessage && (commitMessage.textContent = versions.message);
    commitSha && (commitSha.textContent = versions.sha);

    const modalBtn = document.querySelector('.modal button');

    if (!modalBtn) throw Error('Modal BT');

    modalBtn.addEventListener('click', () => {
        document.querySelector('.modal')?.classList.remove('d-block');
        document.querySelector('.modal-backdrop')?.classList.add('d-none');
    });

    function addLogMessage(message: string) {
        if (!logs) throw new ReferenceError('Logs container not found');

        const container = document.createElement('pre'),
            span = document.createElement('span');

        container.appendChild(span);

        if (!message.startsWith('--'))
            container.style.marginLeft = '30px';
        else
            container.style.margin = '5px 0 5px 0';

        span.textContent = message;

        const scroll = logs.scrollTop + logs.clientHeight >= logs.scrollHeight - 1;

        logs.appendChild(container);

        if (scroll)
            logs.scrollTo(0, logs.scrollHeight);
    }

    function logError(error: string) {
        if (!logs) throw new ReferenceError('Logs container not found');

        const container = document.createElement('pre');

        container.style.color = 'red';
        container.textContent = error;

        logs.appendChild(container);

        logs.scrollTo(0, logs.scrollHeight);
    }

    button?.addEventListener('click', async () => {
        button.setAttribute('disabled', 'disabled');
        if (!completionStatus) throw new ReferenceError('completionStatus not found');
        completionStatus.textContent = 'Please wait...';

        try {
            await window.mainAPI.program();

            completionStatus.textContent = 'Complete!';
        } catch (e) {
            if (typeof e === 'string') {
                logError(e);
            } else if (e instanceof Error) {
                logError(e.message);
            } else {
                logError(JSON.stringify(e, null, 3));
            }

            completionStatus.textContent = `Failed! See logs for more info.`

        } finally {
            button.removeAttribute('disabled');
        }
    });

    window.mainAPI.onLog((e, message) => addLogMessage(message));
    window.mainAPI.onLogError((e, message) => logError(message));
});