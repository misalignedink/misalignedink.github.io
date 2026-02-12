---
layout: page
title: Scribbles
permalink: /scribbles/
---
<section>
  {% assign writings_by_category = site.writings | group_by: 'category' | sort: 'name' %}
  
  {% if site.writings[0] %}
    {% for category_group in writings_by_category %}
      <h3>{{ category_group.name | capitalize }}s</h3>
      <ul>
        {% assign sorted_writings = category_group.items | sort: 'date' | reverse %}
        {% for writing in sorted_writings %}
          <li><time>{{ writing.date | date:"%d %b %Y" }} - </time>
            <a href="{{ writing.url | prepend: site.baseurl | replace: '//', '/' }}">
              {{ writing.title }}
            </a>
          </li>
        {% endfor %}
      </ul>
    {% endfor %}
  {% endif %}
</section>
