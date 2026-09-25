import { Component, input, Input } from '@angular/core';
import { IComment } from '../../../../../../core/models/Comment/icomment.interface';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-comments',
  imports: [DatePipe],
  templateUrl: './comments.component.html',
  styleUrl: './comments.component.css',
})
export class CommentsComponent {

  postComments = input<IComment[]>()


}
