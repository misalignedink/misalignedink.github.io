---
layout: default
---

<link rel="stylesheet" href="assets/fontawesome/css/all.min.css">

<!-- <style>
img.profile-pic {
  float: right;
  margin-left: 20px;
  width: 200px;
  border-radius: 12px;  
}

@media (max-width: 1024px) {
  img.profile-pic {
    width: 40% !important;
    float: none;
    display: block;
    margin: 0 auto 20px auto;
  }
}
</style>

<img src="/assets/images/dp.jpg" class="profile-pic" /> -->


**Latest Scribbles**

<ul>
{% assign sorted_writings = site.writings | sort: 'date' | reverse %}
{% for writing in sorted_writings limit:5 %}
  <li style="margin-bottom: 8px;">
    <a href="{{ writing.url | relative_url }}" style="font-size: 1rem;">
      {{ writing.title }}
    </a>
    <code style="font-size: 0.85rem; margin-left: 4px;">{{ writing.category }}</code>
    <span style="color: gray; font-size: 0.9rem;">— {{ writing.date | date: "%b %d, %Y" }}</span>
  </li>
{% endfor %}
</ul>

<a href="{{ '/scribbles/' | relative_url }}" style="font-size: 0.9rem;">See more ></a>

<br />

**Latest Blogs**

<ul>
{% for post in site.posts limit:5 %}
  <li style="margin-bottom: 8px;">
    <a href="{{ post.url | relative_url }}" style="font-size: 1rem;">
      {{ post.title }}
    </a>
    <span style="color: gray; font-size: 0.9rem;"> — {{ post.date | date: "%b %d, %Y" }}</span>
  </li>
{% endfor %}
</ul>

<a href="{{ '/blogs/' | relative_url }}" style="font-size: 0.9rem;">See more ></a>

<br />

