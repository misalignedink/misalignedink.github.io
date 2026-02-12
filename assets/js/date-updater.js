document.addEventListener('DOMContentLoaded', function () {
    const currentYear = new Date().getFullYear();
    const yearHeaders = document.querySelectorAll('.year-header');

    yearHeaders.forEach(header => {
        const postYear = parseInt(header.getAttribute('data-year'));

        if (!isNaN(postYear)) {
            if (postYear === currentYear) {
                header.textContent = "This year's posts";
            } else {
                header.textContent = postYear.toString();
            }
        }
    });
});
