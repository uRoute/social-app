import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'search',
})
export class SearchPipe implements PipeTransform {
  transform(arr: any[], value: any): any[] {
    const searchTerm = value?.toLowerCase();
    return arr.filter((item: any) =>
      item?.username?.toLowerCase().includes(searchTerm)
    );
  }
}
