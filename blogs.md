---
layout: page
title: Blogs
permalink: /blogs/
---
<section>
  {% if site.posts[0] %}

    {% capture currentyear %}{{ 'now' | date: "%Y" }}{% endcapture %}
    {% capture firstpostyear %}{{ site.posts[0].date | date: '%Y' }}{% endcapture %}
    {% if currentyear == firstpostyear %}
        <h3 class="year-header" data-year="{{ firstpostyear }}">This year's posts</h3>
    {% else %}  
        <h3 class="year-header" data-year="{{ firstpostyear }}">{{ firstpostyear }}</h3>
    {% endif %}

    {%for post in site.posts %}
      {% unless post.next %}
        <ul>
      {% else %}
        {% capture year %}{{ post.date | date: '%Y' }}{% endcapture %}
        {% capture nyear %}{{ post.next.date | date: '%Y' }}{% endcapture %}
        {% if year != nyear %}
          </ul>
          </ul>
          <h3 class="year-header" data-year="{{ post.date | date: '%Y' }}">{{ post.date | date: '%Y' }}</h3>
          <ul>
          <ul>
        {% endif %}
      {% endunless %}
        <li><time>{{ post.date | date:"%d %b %Y" }} - </time>
          <a href="{{ post.url | prepend: site.baseurl | replace: '//', '/' }}">
            {{ post.title }}
          </a>
        </li>
    {% endfor %}
    </ul>

  {% endif %}
</section>
<script src="{{ '/assets/js/date-updater.js' | relative_url }}"></script>