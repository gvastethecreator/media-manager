const filterButtons = document.querySelectorAll('[data-filter]');
const catalogItems = document.querySelectorAll('.catalog [data-kind]');

for (const button of filterButtons) {
	button.addEventListener('click', () => {
		const filter = button.dataset.filter;
		for (const candidate of filterButtons) candidate.classList.toggle('active', candidate === button);
		for (const item of catalogItems) item.hidden = filter !== 'all' && item.dataset.kind !== filter;
	});
}
